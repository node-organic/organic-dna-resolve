var test = require('tape').test

test('dna resolve (cross references)', function(t) {
  var dna = {
    cells: {
      cwd: 'root',
      start: [
        '@http.start',
      ],
    },
    http: {
      cwd: '@cells.cwd',
      start: 'cd &{cwd}',
    },
  }

  require('../index')(dna)

  t.is(dna.cells.cwd, 'root')
  t.is(dna.cells.start[0], 'cd root')
  t.is(dna.http.cwd, 'root')
  t.is(dna.http.start, 'cd root')

  t.end()
})
