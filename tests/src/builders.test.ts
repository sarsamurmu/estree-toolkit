import { builders as b, types as t } from '<project>'
import { setNodeValidationEnabled } from '<project>/builders'

test('basic', () => {
  expect(b.identifier('x')).toEqual<t.Identifier>({
    type: 'Identifier',
    name: 'x'
  })
})

describe('optional fields', () => {
  test('static', () => {
    expect(
      b.property('init', b.identifier('key'), b.identifier('value'))
    ).toEqual(expect.objectContaining({
      type: 'Property',
      kind: 'init',
      key: {
        type: 'Identifier',
        name: 'key'
      },
      value: {
        type: 'Identifier',
        name: 'value'
      },
      computed: false,
      shorthand: false
    }))
  })

  test('computed', () => {
    expect(b.importSpecifier(b.identifier('imp'))).toEqual<t.ImportSpecifier>({
      type: 'ImportSpecifier',
      imported: {
        type: 'Identifier',
        name: 'imp'
      },
      local: {
        type: 'Identifier',
        name: 'imp'
      }
    })
    expect(b.exportSpecifier(b.identifier('exp'))).toEqual<t.ExportSpecifier>({
      type: 'ExportSpecifier',
      exported: {
        type: 'Identifier',
        name: 'exp'
      },
      local: {
        type: 'Identifier',
        name: 'exp'
      }
    })
  })
})

test('validation', () => {
  setNodeValidationEnabled(false)
  expect(() => b.identifier(null)).not.toThrow()
  setNodeValidationEnabled(true)
  expect(() => b.identifier(null)).toThrow()
  expect(b.tryStatement(
    b.blockStatement([]),
    b.catchClause(b.identifier('e'), b.blockStatement([])),
    b.blockStatement([])
  )).toEqual({
    type: 'TryStatement',
    block: {
      type: 'BlockStatement',
      body: []
    },
    handler: {
      type: 'CatchClause',
      param: {
        type: 'Identifier',
        name: 'e'
      },
      body: {
        type: 'BlockStatement',
        body: []
      }
    },
    finalizer: {
      type: 'BlockStatement',
      body: []
    }
  })
})
