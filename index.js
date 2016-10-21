var selectBranch = require('organic-dna-branches').selectBranch
var clone = require('clone')

var re = {
  processEnv: /{\$[A-Z_]+}/g,
  processEnvStrip: /\$|{|}/g,
  reference: /^@[A-Za-z0-9_\-\.]+/,
  cloneReference: /^!@[A-Za-z0-9_\-\.]+/,
  selfReference: /&\{[A-Za-z0-9_\-]+\}/g,
  selfReferenceStrip: /&|{|}/g,
  referencePlaceholder: /@{[A-Za-z0-9_\-\.]+\}/g,
  referencePlaceholderStrip: /@|{|}/g,
}

var resolveValue = function(dna, query) {
  try {
    return selectBranch(dna, query)
  } catch(e) {
    console.log(dna, query)
    throw e
  }
}

var filterMatches = function (value, index, array) {
  return !index || value !== array[index - 1]
}

var resolveSelfReferencePlaceholders = function (dna, valueWithPlaceholdes) {
  var matches = valueWithPlaceholdes.match(re.selfReference).sort().filter(filterMatches)

  for (var i in matches) {
    var match = matches[i].replace(re.selfReferenceStrip, '')
    if (!dna[match]) {
      console.warn('organic-dna-resolve: ' + match + ' is not found. self referenced within dna key: ' + valueWithPlaceholdes)
    }
    valueWithPlaceholdes = valueWithPlaceholdes.replace(new RegExp('&{' + match + '}', 'g'), dna[match])
  }

  return valueWithPlaceholdes
}

var walkSelfReferences = function (dna, rootDNA) {
  for(var key in dna) {
    switch(true) {
      case re.selfReference.test(dna[key]):
        dna[key] = resolveSelfReferencePlaceholders(dna, dna[key])
      break

      case Array.isArray(dna[key]):
        dna[key] = dna[key].map(function(item) {
          return walkSelfReferences(item, rootDNA)
        })
      break

      case typeof dna[key] == 'object':
        walkSelfReferences(dna[key], rootDNA)
      break
    }
  }
  return dna
}

var walk = function(dna, rootDNA) {
  for(var key in dna) {
    switch(true) {
      case key === '@':
        dna = resolveValue(rootDNA, dna[key])
      break
      case re.reference.test(dna[key]):
        dna[key] = resolveValue(rootDNA, dna[key].substr(1))
      break

      case key === '!@':
        dna = clone(resolveValue(rootDNA, dna[key]))
      break
      case re.cloneReference.test(dna[key]):
        dna[key] = clone(resolveValue(rootDNA, dna[key].substr(2)))
      break

      case re.referencePlaceholder.test(dna[key]):
        var matches = dna[key].match(re.referencePlaceholder).sort().filter(filterMatches)

        for (var i in matches) {
          var match = matches[i].replace(re.referencePlaceholderStrip, '')
          var value = resolveValue(rootDNA, match)
          dna[key] = dna[key].replace(new RegExp('@{' + match + '}', 'g'), value)
        }
      break

      case re.processEnv.test(dna[key]):
        var matches = dna[key].match(re.processEnv).sort().filter(filterMatches)

        for (var i in matches) {
          var match = matches[i].replace(re.processEnvStrip, '')
          if (!process.env[match]) {
            console.warn('organic-dna-resolve: process.env.' + match + ' is not defined. referenced by dna key: ' + key)
          }
          dna[key] = dna[key].replace(new RegExp('{\\$' + match + '}', 'g'), process.env[match])
        }
      break

      case Array.isArray(dna[key]):
        dna[key] = dna[key].map(function(item) {
          return walk(item, rootDNA)
        })
      break

      case typeof dna[key] == 'object':
        walk(dna[key], rootDNA)
      break
    }
  }

  return dna
}

module.exports = function(rootDNA) {
  walkSelfReferences(rootDNA, rootDNA)
  walk(rootDNA, rootDNA)
}
