var test = require('tape').test

test('dna resolve example', function(t) {

  var dna = {
    "branchSource": {
      "child-branchSource": {
        "property": 42
      }
    },
    "templateSource": {
      "template": true,
      "property-<=variable1=>": "having <=variable1=>"
    },
    "branch": {
      "child-branch": {
        "array": [
          {"@": "branchSource"},
          {"!@": "branchSource.child-branchSource"},
          "@branchSource.child-branchSource.property",
          "value with @{branchSource.child-branchSource.property}",
          "%templateSource(variable1=value1)"
        ],
        "child-branch-key": "value {$ENV_VAR}"
      },
      "branch-key": "&{child-branch.child-branch-key}"
    }
  }

  process.env.ENV_VAR = 'test'
  require('../index')(dna)

  t.is(JSON.stringify(dna).replace(/\s/g, ''), (`{
    "branchSource": {
      "child-branchSource": {
        "property": 42
      }
    },
    "templateSource": {
      "template": true,
      "property-<=variable1=>": "having <=variable1=>"
    },
    "branch": {
      "child-branch": {
        "array": [
          {
            "child-branchSource": {
              "property": 42
            }
          },
          {
            "property": 42
          },
          42,
          "value with 42",
          {
            "template": true,
            "property-value1": "having value1"
          }
        ],
        "child-branch-key": "value test"
      },
      "branch-key": "value test"
    }
  }`).replace(/\n/g, '').replace(/\t/g, '').replace(/\s/g, '').trim())

  t.end()
})
