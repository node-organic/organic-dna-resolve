# organic-dna-resolve

'Shotgun' for resolving DNA values

Works with:
- `@branch[.property]` direct references
- `!@branch[.property]` clone referenced branch/property
- `{$ENV_VAR}` reference process.env variables
- `&{property}` reference a property from the current (container) branch
- `"@{branch[.property]}"` in place reference
- `%branch.path(variableName=variableValue, anotherName=another value)`

## example

### given

```
var dna = {
  "branchSource": {
    "child-branchSrouce": {
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
        {"@": "branchSrouce"},
        {"!@": "branchSrouce.child-branchSrouce"},
        "@branchSrouce.child-branchSrouce.property",
        "value with @{branchSrouce.child-branchSrouce.property}",
        "%templateSource(variable1=value1)"
      ],
      "child-branch-key": "value {$ENV_VAR}"
    },
    "branch-key": "&{child-branch.child-branch-key}"
  }
}

process.env.ENV_VAR = 'test'

require('organic-dna-resolve')(dna)

console.log(JSON.stringify(dna, null, 2))
```

### outputs

```
{
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
}
```

More examples can be found in tests folder
