import { is, traverse, types as t } from '<project>'

describe('node type', () => {
  test('node', () => {
    const identifier: t.Node = { type: 'Identifier', name: 'x' }
    expect(is.identifier(identifier)).toBe(true)
    expect(is.literal(identifier)).toBe(false)
  })

  test('nodePath', () => {
    const ast: t.Node = { type: 'Identifier', name: 'x' }

    traverse(ast, {
      Identifier(path) {
        expect(is.identifier(path)).toBe(true)
        expect(is.literal(path)).toBe(false)
      }
    })

    expect.assertions(2)
  })

  test('returns false if null or undefined', () => {
    expect(is.literal(null)).toBe(false)
    expect(is.ifStatement(undefined)).toBe(false)
  })

  describe('matcher', () => {
    test('primitive value', () => {
      const identifier: t.Node = { type: 'Identifier', name: 'x' }
      expect(is.identifier(identifier, { name: 'x' })).toBe(true)
      expect(is.identifier(identifier, { name: 'z' })).toBe(false)
    })

    test('function', () => {
      const identifier: t.Node = { type: 'Identifier', name: 'cool_name' }
      expect(is.identifier(identifier, { name: (v) => v.includes('cool') })).toBe(true)
      expect(is.identifier(identifier, { name: (v) => v.includes('not') })).toBe(false)
    })
  })
})

describe('alias', () => {
  test('node', () => {
    const identifier: t.Node = { type: 'Identifier', name: 'x' }
    expect(is.pattern(identifier)).toBe(true)
    expect(is.statement(identifier)).toBe(false)
  })

  test('nodePath', () => {
    const ast: t.Node = { type: 'Identifier', name: 'x' }

    traverse(ast, {
      Identifier(path) {
        expect(is.pattern(path)).toBe(true)
        expect(is.statement(path)).toBe(false)
      }
    })

    expect.assertions(2)
  })

  test('returns false if null or undefined', () => {
    expect(is.function(null)).toBe(false)
    expect(is.pattern(undefined)).toBe(false)
  })

  describe('matcher', () => {
    test('primitive value', () => {
      const identifier: t.Node = { type: 'Identifier', name: 'x' }
      expect(is.pattern(identifier, { name: 'x' })).toBe(true)
      expect(is.pattern(identifier, { name: 'z' })).toBe(false)
    })

    test('function', () => {
      const identifier: t.Node = { type: 'Identifier', name: 'cool_name' }
      expect(is.pattern(identifier, { name: (v: string) => v.includes('cool') })).toBe(true)
      expect(is.pattern(identifier, { name: (v: string) => v.includes('not') })).toBe(false)
    })
  })
})
