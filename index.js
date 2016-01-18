var selectBranch = require('organic-dna-branches').selectBranch
var clone = require('clone')

var re = {
  processEnv: /{\$[A-Z_]+}/g,
  processEnvStrip: /\$|{|}/g,
  reference: /^@/,
  cloneReference: /^!@/
}

var resolveValue = function(dna, query) {
  try {
    return selectBranch(dna, query)
  } catch(e) {
    console.log(dna, query)
    throw e
  }
}

var walk = function(dna, rootDNA) {
  for(var key in dna) {
    switch(true) {
      case re.reference.test(key):
        dna = resolveValue(rootDNA, dna[key])
      break
      case re.reference.test(dna[key]):
        dna[key] = resolveValue(rootDNA, dna[key].substr(1))
      break

      case re.cloneReference.test(key):
        dna = clone(resolveValue(rootDNA, dna[key]))
      break
      case re.cloneReference.test(dna[key]):
        dna[key] = clone(resolveValue(rootDNA, dna[key].substr(2)))
      break

      case re.processEnv.test(dna[key]):
        var matches = dna[key].match(re.processEnv).sort().filter(function (value, index, array) {
          return !index || value !== array[index - 1]
        })

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
  walk(rootDNA, rootDNA)
}