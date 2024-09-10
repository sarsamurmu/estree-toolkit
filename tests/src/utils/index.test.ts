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
  `.split('---')
  
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
  `.split('---')
  
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
  
  test.each(positiveCases)('positive %s', (code) => {
    expect(findTargetReferenceCount(code)).toBe(1)
  })
  test.each(negativeCases)('negative %s', (code) => {
    expect(findTargetReferenceCount(code)).toBe(0)
  })
})
