var test = require('tape').test

test('dna resolve example', function(t) {

  var dna = {
    "branchSource": {
      "child-branchSource": {
        "property": 42
      }
    },
    "branch": {
      "child-branch": {
        "array": [
          {"@": "branchSource"},
          {"!@": "branchSource.child-branchSource"},
          "@branchSource.child-branchSource.property",
          "value with @{branchSource.child-branchSource.property}"
        ],
        "child-branch-key": "value {$ENV_VAR}"
      },
      "branch-key": "&{child-branch.child-branch-key}"
    }
  }

  process.env.ENV_VAR = 'test'
  require('../index')(dna)

  t.is(JSON.stringify(dna), '{"branchSource":{"child-branchSource":{"property":42}},"branch":{"child-branch":{"array":[{"child-branchSource":{"property":42}},{"property":42},42,"value with 42"],"child-branch-key":"value test"},"branch-key":"value test"}}')

  t.end()
})
