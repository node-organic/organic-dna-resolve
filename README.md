# organic-dna-resolve

'Shotgun' for resolving DNA values

Works with:
- `@branch[.property]` direct references
- `!@branch[.property]` clone referenced branche/property
- `{$ENV_VAR}` reference process.env variables
- `&{property}` reference a property from the current (container) branch
- `"@{branch[.property]}"` in place reference (supported only for string values)

Example usage can be found in tests folder
