var test = require('tape').test

test('dna resolve', function(t) {

  var dna = {
    branch: {
      property: 'value',
      PATH: '{$PATH}',
      substitute_path: 'test {$PATH}{$PATH}{$HOME}'
    },
    otherBranch: {
      propertyValueReference: '@branch.property',
      wholeBranch: '@branch',
      array: [{'@': 'branch'}, {'@': 'branch.property'}]
    },
    clonedBranch: {
      propertyValueReference: '!@branch.property',
      wholeBranch: '!@branch',
      array: [{'!@': 'branch'}, {'!@': 'branch.property'}]
    }
  }

  require('../index')(dna)

  t.is(dna.branch.property, 'value')
  t.is(dna.branch.PATH, process.env.PATH)
  t.is(dna.branch.substitute_path,
    'test ' + process.env.PATH + process.env.PATH + process.env.HOME)

  dna.branch.property = 'new value'
  dna.branch.PATH = 'changed'

  t.is(dna.branch.property, 'new value')
  t.is(dna.branch.PATH, 'changed')

  //

  t.is(dna.otherBranch.propertyValueReference, 'value')
  t.is(dna.otherBranch.wholeBranch.property, 'new value')

  t.is(dna.otherBranch.array[0].property, 'new value')
  t.is(dna.otherBranch.array[1], 'value')

  t.is(dna.otherBranch.wholeBranch.PATH, 'changed')

  //

  t.is(dna.clonedBranch.propertyValueReference, 'value')
  t.is(dna.clonedBranch.wholeBranch.property, 'value')

  t.is(dna.clonedBranch.array[0].property, 'value')
  t.is(dna.clonedBranch.array[1], 'value')

  t.is(dna.clonedBranch.wholeBranch.PATH, process.env.PATH)

  //

  t.end()
})
