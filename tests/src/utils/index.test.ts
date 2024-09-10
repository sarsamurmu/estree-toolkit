import { parseModule } from 'meriyah'

import { traverse, utils as u } from '<project>'
import { NodeT } from '<project>/helpers'

test('getCommonAncestor', () => {
  const ast = parseModule(`
    const fn = () => {
      {
        {
          {
            {
              5
              {
                {
                  {
                    {
                      {
                        {
                          a
                        }
                      }
                    }
                  }
                }
              }

              {
                {
                  {
                    b
                  }
                }
              }
            }
          }
        }
      }
    }
  `)
  const paths = []

  traverse(ast, {
    Identifier(path) {
      if (/a|b/.test(path.node.name)) {
        paths.push(path)
      }
    }
  })

  expect((u.getCommonAncestor(paths).node as NodeT<'BlockStatement'>).body[0]).toEqual({
    type: 'ExpressionStatement',
    expression: { type: 'Literal', value: 5 }
  })
})

// Taken from - https://github.com/Rich-Harris/is-reference/blob/master/test/test.mjs
describe('isReference', () => {
  const positiveCases = `
    target
    ---
    var target
    ---
    function target() {}
    ---
    function x(target) {}
    ---
    function x({ target }) {}
    ---
    function x([ target ]) {}
    ---
    function x(target = 0) {}
    ---
    function x({ target = 42 }) {}
    ---
    target.x
    ---
    var x = { [target]: 1 }
    ---
    var x = { y: target }
    ---
    class x { [target] = 1 }
    ---
    class x { x = target }
  `
  
  const negativeCases = `
    var x = { target: 1 }
    ---
    x.target
    ---
    var x; export { x as target }
    ---
    target: while (true) break target
    ---
    target: while (true) continue target
    ---
    import { target as x } from 'x'
    ---
    class x { target = 1 }
  `
  
  const findTargetReferenceCount = (code) => {
    let count = 0

    traverse(parseModule(code), {
      $: { scope: true },
      Identifier(path) {
        if (path.node.name === 'target') {
          if (u.isReference(path)) count++
        }
      }
    })

    return count
  }

  const toCases = (x: string) => x.split('---').map(x => x.trim())
  
  test.each(toCases(positiveCases))('positive - %s', (code) => {
    expect(findTargetReferenceCount(code)).toBe(1)
  })
  test.each(toCases(negativeCases))('negative - %s', (code) => {
    expect(findTargetReferenceCount(code)).toBe(0)
  })

  test('throws error when scope is false', () => {
    const ast = parseModule(`
      target
    `)

    traverse(ast, {
      Identifier(path) {
        expect(() => u.isReference(path)).toThrow('`scope` is not enabled')
      }
    })

    expect.assertions(1)
  })

  test('do not include globals', () => {
    const ast = parseModule(`
      var target;
      global;
      target.x;
    `)

    traverse(ast, {
      $: { scope: true },
      Identifier(path) {
        if (path.node.name === 'target') {
          expect(u.isReference(path, false)).toBe(true)
        } else if (path.node.name === 'global') {
          expect(u.isReference(path, false)).toBe(false)
        }
      }
    })

    expect.assertions(3)
  })
})
