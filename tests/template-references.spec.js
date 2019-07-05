var test = require('tape').test

test('dna templated references', function(t) {
  var dna = {
    templateBranch: '<=variable=> <=variable2=> <=v3=>',
    branch: '%templateBranch(variable=value, variable2=value2, v3=something else, var4)'
  }

  require('../index')(dna)

  t.is(dna.branch, 'value value2 something else')

  t.end()
})
