var test = require('tape').test

test('dna resolve (double references)', function(t) {
  var dna = {
    branch: 'value',
    branch2: '@{branch} and {$ENV_VAR}'
  }

  process.env.ENV_VAR = 'value2'
  require('../index')(dna)
  delete process.env.ENV_VAR

  t.is(dna.branch2, 'value and value2')

  t.end()
})

test('dna resolve (double references) 2', function(t) {
  var dna = {
    branch0: 'end',
    branch: 'value',
    branch2: '@{branch} and {$ENV_VAR} ==> @{branch3} but @{branch0}',
    branch3: '@{branch}'
  }

  process.env.ENV_VAR = 'value2'
  require('../index')(dna)
  delete process.env.ENV_VAR

  t.is(dna.branch2, 'value and value2 ==> value but end')
  t.is(dna.branch3, 'value')

  t.end()
})
