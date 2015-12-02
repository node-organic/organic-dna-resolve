var selectBranch = require('organic-dna-branches').selectBranch
var clone = require('clone')

var re = {
  processEnv: /^process\.env\./,
  reference: /^@/,
  cloneReference: /^!@/
}

var resolveValue = function(dna, query) {
  if(re.processEnv.test(query)) {
    return process.env[query.substr(12)]
  }

  try {
    return selectBranch(dna, query)
  } catch(e) {
    console.log(dna, query)
    throw e
  }
}

var walk = function(dna, rootDNA) {
  Object.keys(dna).forEach(function(key) {
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

      case Array.isArray(dna[key]):
        dna[key] = dna[key].map(function(item) {
          return walk(item, rootDNA)
        })
      break
      case typeof dna[key] == 'object':
        walk(dna[key], rootDNA)
      break
    }
  })

  return dna
}

module.exports = function(rootDNA) {
  walk(rootDNA, rootDNA)
}