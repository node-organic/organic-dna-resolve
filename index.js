var selectBranch = require('organic-dna-branches').selectBranch
var clone = require('clone')

var re = {
  processEnv: /{\$[A-Z_]+}/g,
  processEnvStrip: /\$|{|}/g,
  reference: /^@[A-Za-z0-9_\-\.]+/,
  cloneReference: /^!@[A-Za-z0-9_\-\.]+/,
  selfReference: /&\{[A-Za-z0-9_\-\.]+\}/g,
  selfReferenceStrip: /&|{|}/g,
  referencePlaceholder: /@{[A-Za-z0-9_\-\.]+\}/g,
  referencePlaceholderStrip: /@|{|}/g,
  templateReference: /%[A-Za-z0-9_\-\.]+\([A-Za-z0-9_\-\.\s,=]+\)/
}

var format = function (value, pairs) {
  let matches = value.match(/<=([A-Za-z0-9_\-\.]+)=>/g)
  if (!matches) return value
  for (let i = 0; i < matches.length; i++) {
    let pairKey = matches[i].replace('<=', '').replace('=>', '')
    if (pairs[pairKey]) {
      value = value.replace(matches[i], pairs[pairKey])
    }
  }
  return value
}

var resolveValue = function(dna, query, rootDNA) {
  try {
    return resolveReferencePlaceholders(rootDNA || dna, selectBranch(dna, query), query)
  } catch(e) {
    console.log(dna, query)
    throw e
  }
}

var walkAndResolveTemplatePlaceholders = function (branch, variablePairs) {
  if (typeof branch === 'string') {
    let result = format(branch, variablePairs)
    return result
  }
  for(let key in branch) {
    let result = branch[key]
    if (Array.isArray(branch[key])) {
      result = branch[key].map((v) => walkAndResolveTemplatePlaceholders(v, variablePairs))
    }
    if (typeof branch[key] === 'object') {
      result = walkAndResolveTemplatePlaceholders(branch[key], variablePairs)
    }
    if (typeof branch[key] === 'string') {
      result = format(branch[key], variablePairs)
    }
    let newKey = format(key, variablePairs)
    if (newKey !== key) {
      branch[newKey] = result
      delete branch[key]
    } else {
      branch[key] = result
    }
  }
  return branch
}

var resolveTemplateReference = function (rootDNA, query) {
  // dot.notated.path.to.branch(variableName=variableValue)
  let matches = query.match(/(.*)\((.*)\)/)
  let branchName = matches[1]
  let variables = matches[2].split(',')
  let variablePairs = {}
  variables.forEach((v) => {
    let parts = v.split('=')
    if (!parts[1]) return
    variablePairs[parts[0].trim()] = parts[1].trim()
  })
  var branch = clone(selectBranch(rootDNA, branchName))
  branch = walkAndResolveTemplatePlaceholders(branch, variablePairs)
  if (typeof branch === 'object') {
    walk(branch, rootDNA)
  }
  return branch
}

var filterMatches = function (value, index, array) {
  return !index || value !== array[index - 1]
}

var resolveSelfReferencePlaceholders = function (rootDNA, dna, valueWithPlaceholdes, key) {
  var matches = valueWithPlaceholdes.match(re.selfReference).sort().filter(filterMatches)

  for (var i in matches) {
    var match = matches[i].replace(re.selfReferenceStrip, '')
    var value = resolveValue(dna, match, rootDNA)
    valueWithPlaceholdes = valueWithPlaceholdes.replace(new RegExp('&{' + match + '}', 'g'), value)
  }

  return valueWithPlaceholdes
}

var walkSelfReferences = function (dna, rootDNA) {
  for(var key in dna) {
    switch(true) {
      case Array.isArray(dna[key]):
        dna[key] = dna[key].map(function(item) {
          if (typeof item === 'string' && re.selfReference.test(item)) {
            return resolveSelfReferencePlaceholders(rootDNA, dna, item, key)
          }
          return walkSelfReferences(item, rootDNA)
        })
      break

      case typeof dna[key] == 'object':
        walkSelfReferences(dna[key], rootDNA)
      break

      case re.selfReference.test(dna[key]):
        dna[key] = resolveSelfReferencePlaceholders(rootDNA, dna, dna[key], key)
      break
    }
  }
  return dna
}

var resolveReferencePlaceholders = function (rootDNA, item, key) {
  switch(true) {
    
    case re.templateReference.test(item):
      return resolveTemplateReference(rootDNA, item.substr(1))
    break

    case re.reference.test(item):
      return resolveValue(rootDNA, item.substr(1))
    break

    case re.cloneReference.test(item):
      return clone(resolveValue(rootDNA, item.substr(2)))
    break

    default:
      if (re.referencePlaceholder.test(item)) {
        var matches = item.match(re.referencePlaceholder).sort().filter(filterMatches)

        for (var i in matches) {
          var match = matches[i].replace(re.referencePlaceholderStrip, '')
          var value = resolveValue(rootDNA, match)
          item = item.replace(new RegExp('@{' + match + '}', 'g'), value)
        }
      }
      if (re.processEnv.test(item)) {
        var matches = item.match(re.processEnv).sort().filter(filterMatches)

        for (var i in matches) {
          var match = matches[i].replace(re.processEnvStrip, '')
          item = item.replace(new RegExp('{\\$' + match + '}', 'g'), process.env[match])
        }
      }
      return item
    break
  }
}

var walk = function(dna, rootDNA) {
  for(var key in dna) {
    switch(true) {
      case Array.isArray(dna[key]):
        dna[key] = dna[key].map(function(item) {
          if (typeof item === 'string') {
            return resolveReferencePlaceholders(rootDNA, item, key)
          }
          if (item['@']) {
            return resolveValue(rootDNA, item['@'])
          }
          if (item['!@']) {
            return clone(resolveValue(rootDNA, item['!@']))
          }
          walk(item, rootDNA)
          return item
        })
      break

      case typeof dna[key] == 'object':
        walk(dna[key], rootDNA)
      break

      default:
        dna[key] = resolveReferencePlaceholders(rootDNA, dna[key], key)
      break
    }
  }

  return dna
}

module.exports = function(rootDNA) {
  walkSelfReferences(rootDNA, rootDNA)
  walk(rootDNA, rootDNA)
}
