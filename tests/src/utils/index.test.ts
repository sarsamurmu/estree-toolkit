import { parseModule } from 'meriyah'

import { traverse, utils as u } from '<project>'
import { NodeT } from '<project>/estree'

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
