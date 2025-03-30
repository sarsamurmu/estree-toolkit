import { NodePath, traverse, types as t } from '<project>'

describe('Methods', () => {
  //#region Misc.

  describe('cloneNode', () => {
    test('default', () => {
      const ast = {
        type: 'Identifier',
        name: 'x'
      }

      traverse(ast, {
        Identifier(path) {
          const clone = path.cloneNode()
          clone.name = 'y'
        }
      })

      expect(ast.name).toBe('x')
    })

    test('custom function', () => {
      const ast = {
        type: 'Identifier',
        name: 'x'
      }

      traverse(ast, {
        $: {
          // Just for test, don't do this in reality
          cloneFunction: (x) => x
        },
        Identifier(path) {
          const clone = path.cloneNode()
          clone.name = 'y'
        }
      })

      expect(ast.name).toBe('y')
    })
  })

  //#endregion

  //#region Traversal

  test('skip', () => {
    const ast = {
      type: 'ExpressionStatement',
      expression: {
        type: 'Identifier',
        name: 'x'
      }
    }

    const expressionMock = jest.fn<void, [NodePath]>((path) => {
      path.get<t.Identifier>('expression').skip()
    })
    const identifierMock = jest.fn<void, [NodePath]>()

    traverse(ast, {
      ExpressionStatement: expressionMock,
      Identifier: identifierMock
    })

    expect(expressionMock).toBeCalledTimes(1)
    expect(identifierMock).toBeCalledTimes(0)
  })

  describe('unSkip', () => {
    test('traverses the unSkipped path when in visiting phase', () => {
      const ast = {
        type: 'ExpressionStatement',
        expression: {
          type: 'Identifier',
          name: 'x'
        }
      }

      const expressionMock = jest.fn<void, [NodePath]>((path) => {
        const identifierPath = path.get<t.Identifier>('expression')
        identifierPath.skip()
        identifierPath.unSkip()
      })
      const identifierMock = jest.fn<void, [NodePath]>()

      traverse(ast, {
        ExpressionStatement: expressionMock,
        Identifier: identifierMock
      })

      expect(expressionMock).toBeCalledTimes(1)
      expect(identifierMock).toBeCalledTimes(1)
    })

    test('does not traverses the unSkipped path when not in visiting phase', () => {
      const ast = {
        type: 'ExpressionStatement',
        expression: {
          type: 'Identifier',
          name: 'x'
        }
      }

      let identifierPath: NodePath
      const expressionMock = jest.fn<void, [NodePath]>((path) => {
        identifierPath = path.get<t.Identifier>('expression')
        identifierPath.skip()
      })
      const identifierMock = jest.fn<void, [NodePath]>()

      traverse(ast, {
        ExpressionStatement: expressionMock,
        Identifier: identifierMock
      })

      identifierPath.unskip()

      expect(expressionMock).toBeCalledTimes(1)
      expect(identifierMock).toBeCalledTimes(0)
    })
  })

  test('skipChildren', () => {
    // Basic
    const prop = {
      type: 'Property',
      kind: 'init',
      computed: false,
      method: false,
      shorthand: false
    }
    const ast1 = {
      type: 'ExpressionStatement',
      expression: {
        type: 'ObjectExpression',
        properties: [
          {
            ...prop,
            key: { type: 'Identifier', name: 'x' },
            value: {
              type: 'ArrayExpression',
              elements: [
                { type: 'Identifier', name: 'a' },
                { type: 'Identifier', name: 'b' }
              ]
            },
          },
          {
            ...prop,
            key: { type: 'Identifier', name: 'y' },
            value: {
              type: 'ArrayExpression',
              elements: [
                { type: 'Identifier', name: 'c' },
                { type: 'Identifier', name: 'd' }
              ]
            },
          }
        ]
      }
    }
    const identifiers1 = []

    traverse(ast1, {
      Property(path) {
        if ((path.node.key as t.Identifier).name === 'x') {
          path.skipChildren()
        }
      },
      Identifier({ node }) {
        identifiers1.push(node.name)
      }
    })

    expect(identifiers1).toEqual(['y', 'c', 'd'])

    // With children array
    const ast2 = {
      type: 'ArrayExpression',
      elements: [
        { type: 'Identifier', name: 'a' },
        { type: 'Identifier', name: 'b' },
        { type: 'Identifier', name: 'c' },
        { type: 'Identifier', name: 'd' }
      ]
    }
    const identifiers2 = []

    traverse(ast2, {
      ArrayExpression(path) {
        path.skipChildren()
      },
      Identifier({ node }) {
        identifiers2.push(node.name)
      }
    })

    expect(identifiers2).toEqual([])

    // `null` children
    const ast3 = {
      type: 'IfStatement',
      test: {
        type: 'Identifier',
        name: 'x'
      },
      consequent: {
        type: 'ExpressionStatement',
        expression: {
          type: 'Identifier',
          name: 'y'
        }
      },
      alternate: null
    }

    expect(() => traverse(ast3, {
      IfStatement(path) {
        path.skipChildren()
      }
    })).not.toThrow()
  })

  test('unSkipChildren', () => {
    const prop = {
      type: 'Property',
      kind: 'init',
      computed: false,
      method: false,
      shorthand: false
    }
    const ast1 = {
      type: 'ExpressionStatement',
      expression: {
        type: 'ObjectExpression',
        properties: [
          {
            ...prop,
            key: { type: 'Identifier', name: 'x' },
            value: {
              type: 'ArrayExpression',
              elements: [
                { type: 'Identifier', name: 'a' },
                { type: 'Identifier', name: 'b' }
              ]
            },
          },
          {
            ...prop,
            key: { type: 'Identifier', name: 'y' },
            value: {
              type: 'ArrayExpression',
              elements: [
                { type: 'Identifier', name: 'c' },
                { type: 'Identifier', name: 'd' }
              ]
            },
          }
        ]
      }
    }
    const identifiers1 = []

    traverse(ast1, {
      Property(path) {
        if ((path.node.key as t.Identifier).name === 'x') {
          path.skipChildren()
          path.unskipChildren()
        }
      },
      Identifier({ node }) {
        identifiers1.push(node.name)
      }
    })

    expect(identifiers1).toEqual(['x', 'a', 'b', 'y', 'c', 'd'])

    const ast2 = {
      type: 'ArrayExpression',
      elements: [
        { type: 'Identifier', name: 'a' },
        { type: 'Identifier', name: 'b' },
        { type: 'Identifier', name: 'c' },
        { type: 'Identifier', name: 'd' }
      ]
    }
    const identifiers2 = []

    traverse(ast2, {
      ArrayExpression(path) {
        path.skipChildren()
        path.unskipChildren()
      },
      Identifier({ node }) {
        identifiers2.push(node.name)
      }
    })

    expect(identifiers2).toEqual(['a', 'b', 'c', 'd'])
  })

  //#endregion

  //#region Ancestry

  test('findParent', () => {
    const ast = {
      type: 'BlockStatement',
      body: [
        {
          type: 'BlockStatement',
          body: [
            {
              type: 'ExpressionStatement',
              expression: {
                type: 'Literal',
                value: 0
              }
            }
          ]
        }
      ]
    }

    traverse(ast, {
      Literal(path) {
        expect(
          path.findParent((parent) => parent.type === 'BlockStatement').node
        ).toBe(ast.body[0])
      }
    })

    expect.assertions(1)
  })

  test('find', () => {
    const ast = {
      type: 'ExpressionStatement',
      expression: {
        type: 'Literal',
        value: 0
      }
    }

    traverse(ast, {
      Literal(path) {
        expect(path.find((p) => p.type === 'Literal').node).toBe(ast.expression)
        expect(path.find((p) => p.type === 'ExpressionStatement').node).toBe(ast)
        expect(path.find((p) => p.type === 'Program')).toBe(null)
      }
    })

    expect.assertions(3)
  })

  test('getFunctionParent', () => {
    const ast = {
      type: 'Program',
      sourceType: 'script',
      body: [
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'ArrowFunctionExpression',
            params: [],
            body: {
              type: 'Literal',
              value: 'arrow'
            },
            async: false,
            expression: true
          }
        },
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'AssignmentExpression',
            left: {
              type: 'Identifier',
              name: 'a'
            },
            operator: '=',
            right: {
              type: 'FunctionExpression',
              id: null,
              params: [],
              body: {
                type: 'BlockStatement',
                body: [
                  {
                    type: 'ExpressionStatement',
                    expression: {
                      type: 'Literal',
                      value: 'expression'
                    }
                  }
                ]
              },
              async: false,
              generator: false
            }
          }
        },
        {
          type: 'FunctionDeclaration',
          id: {
            type: 'Identifier',
            name: 'b'
          },
          params: [],
          body: {
            type: 'BlockStatement',
            body: [
              {
                type: 'ExpressionStatement',
                expression: {
                  type: 'Literal',
                  value: 'declaration'
                }
              }
            ]
          },
          async: false,
          generator: false
        }
      ]
    } as const

    traverse(ast, {
      Literal(path) {
        const { node: { value } } = path
        if (value === 'arrow') {
          expect(path.getFunctionParent().node).toBe(ast.body[0].expression)
        } else if (value === 'expression') {
          expect(path.getFunctionParent().node).toBe(ast.body[1].expression.right)
        } else if (value === 'declaration') {
          expect(path.getFunctionParent().node).toBe(ast.body[2])
        }
      }
    })

    expect.assertions(3)
  })

  test('getAncestry', () => {
    const ast = {
      type: 'Program',
      sourceType: 'module',
      body: [
        {
          type: 'VariableDeclaration',
          kind: 'const',
          declarations: [
            {
              type: 'VariableDeclarator',
              id: {
                type: 'Identifier',
                name: 'a'
              },
              init: {
                type: 'ArrayExpression',
                elements: [
                  {
                    type: 'ObjectExpression',
                    properties: [
                      {
                        type: 'Property',
                        key: {
                          type: 'Identifier',
                          name: 'x'
                        },
                        value: {
                          type: 'ArrayExpression',
                          elements: [
                            {
                              type: 'Literal',
                              value: 0
                            }
                          ]
                        },
                        kind: 'init',
                        computed: false,
                        method: false,
                        shorthand: false
                      }
                    ]
                  }
                ]
              }
            }
          ]
        }
      ]
    }

    traverse(ast, {
      Literal(path) {
        const ancestry = path.getAncestry().map((x) => x.type)
        expect(ancestry).toEqual(['Literal', 'ArrayExpression', 'Property', 'ObjectExpression',
          'ArrayExpression', 'VariableDeclarator', 'VariableDeclaration', 'Program'])
      }
    })

    expect.assertions(1)
  })

  test('isAncestorOf, isDescendantOf', () => {
    const ast = {
      type: 'Program',
      sourceType: 'module',
      body: [
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'ArrayExpression',
            elements: [
              {
                type: 'Literal',
                value: 5
              }
            ]
          }
        }
      ]
    }
    let program: NodePath, arrayExpr: NodePath, literal: NodePath

    traverse(ast, {
      Program: (path) => program = path,
      ArrayExpression: (path) => arrayExpr = path,
      Literal: (path) => literal = path
    })

    expect(program.isAncestorOf(arrayExpr)).toBe(true)
    expect(program.isAncestorOf(literal)).toBe(true)
    expect(arrayExpr.isDescendantOf(program)).toBe(true)
    expect(literal.isDescendantOf(program)).toBe(true)
  })

  //#endregion

  //#region Modification

  test('insertBefore', () => {
    const ast = {
      type: 'ArrayExpression',
      elements: [
        {
          type: 'Literal',
          value: 1
        },
        {
          type: 'Literal',
          value: 2
        },
        {
          type: 'Literal',
          value: 3
        }
      ]
    }
    let mockFn: jest.Mock<void, [NodePath<t.Literal>]>

    traverse(ast, {
      Literal: (mockFn = jest.fn((path) => {
        if (path.node.value === 2) {
          const nodePaths = path.insertBefore([
            {
              type: 'Literal',
              value: null
            },
            {
              type: 'Literal',
              value: null
            }
          ])
          expect(path.key).toBe(3)
          expect(nodePaths[0].key).toBe(1)
          expect(nodePaths[1].key).toBe(2)
        }
        if (path.node.value === 3) {
          expect(path.key).toBe(4)
        }
      }))
    })

    expect(mockFn).toBeCalledTimes(5)
    expect(ast).toEqual({
      type: 'ArrayExpression',
      elements: [
        {
          type: 'Literal',
          value: 1
        },
        {
          type: 'Literal',
          value: null
        },
        {
          type: 'Literal',
          value: null
        },
        {
          type: 'Literal',
          value: 2
        },
        {
          type: 'Literal',
          value: 3
        }
      ]
    })

    expect(() => {
      traverse({
        type: 'IfStatement',
        test: {
          type: 'Identifier',
          name: 'x'
        },
        consequent: {
          type: 'BlockStatement',
          body: []
        },
        alternate: null
      }, {
        Identifier(path) {
          path.insertBefore([{ type: 'EmptyStatement' }])
        }
      })
    }).toThrow(/`container` is not an Array/)
  })

  test('insertAfter', () => {
    const ast = {
      type: 'ArrayExpression',
      elements: [
        {
          type: 'Literal',
          value: 1
        },
        {
          type: 'Literal',
          value: 2
        },
        {
          type: 'Literal',
          value: 3
        }
      ]
    }
    let mockFn: jest.Mock<void, [NodePath<t.Literal>]>

    traverse(ast, {
      Literal: (mockFn = jest.fn((path) => {
        if (path.node.value === 2) {
          const nodePaths = path.insertAfter([
            {
              type: 'Literal',
              value: null
            },
            {
              type: 'Literal',
              value: null
            },
          ])
          expect(path.key).toBe(1)
          expect(nodePaths[0].key).toBe(2)
          expect(nodePaths[1].key).toBe(3)
        }
        if (path.node.value === 3) {
          expect(path.key).toBe(4)
        }
      }))
    })

    expect(mockFn).toBeCalledTimes(5)
    expect(ast).toEqual({
      type: 'ArrayExpression',
      elements: [
        {
          type: 'Literal',
          value: 1
        },
        {
          type: 'Literal',
          value: 2
        },
        {
          type: 'Literal',
          value: null
        },
        {
          type: 'Literal',
          value: null
        },
        {
          type: 'Literal',
          value: 3
        }
      ]
    })

    expect(() => {
      traverse({
        type: 'IfStatement',
        test: {
          type: 'Identifier',
          name: 'x'
        },
        consequent: {
          type: 'BlockStatement',
          body: []
        },
        alternate: null
      }, {
        Identifier(path) {
          path.insertAfter([{ type: 'EmptyStatement' }])
        }
      })
    }).toThrow(/`container` is not an Array/)
  })

  test('unshiftContainer', () => {
    const ast1 = {
      type: 'ArrayExpression',
      elements: [
        {
          type: 'Literal',
          value: 2
        },
        {
          type: 'Literal',
          value: 3
        }
      ]
    }
    const mockFn1 = jest.fn()

    traverse(ast1, {
      ArrayExpression(path) {
        const nodePaths = path.unshiftContainer('elements', [
          {
            type: 'Literal',
            value: 0
          },
          {
            type: 'Literal',
            value: 1
          },
        ])
        expect(nodePaths[0].key).toBe(0)
        expect(nodePaths[1].key).toBe(1)
        expect(nodePaths[0].listKey).toBe('elements')
        expect(nodePaths[1].listKey).toBe('elements')
      },
      Literal: mockFn1
    })

    expect(mockFn1).toBeCalledTimes(4)
    expect(ast1).toEqual({
      type: 'ArrayExpression',
      elements: [
        {
          type: 'Literal',
          value: 0
        },
        {
          type: 'Literal',
          value: 1
        },
        {
          type: 'Literal',
          value: 2
        },
        {
          type: 'Literal',
          value: 3
        }
      ]
    })

    const ast2 = {
      type: 'ArrayExpression',
      elements: []
    }
    const mockFn2 = jest.fn()

    traverse(ast2, {
      ArrayExpression(path) {
        const nodePaths = path.unshiftContainer('elements', [
          {
            type: 'Literal',
            value: 0
          },
          {
            type: 'Literal',
            value: 1
          },
        ])
        expect(nodePaths[0].key).toBe(0)
        expect(nodePaths[1].key).toBe(1)
        expect(nodePaths[0].listKey).toBe('elements')
        expect(nodePaths[1].listKey).toBe('elements')
      },
      Literal: mockFn2
    })

    expect(mockFn2).toBeCalledTimes(2)
    expect(ast2).toEqual({
      type: 'ArrayExpression',
      elements: [
        {
          type: 'Literal',
          value: 0
        },
        {
          type: 'Literal',
          value: 1
        }
      ]
    })
  })

  test('insertContainer', () => {
    const ast1 = {
      type: 'ArrayExpression',
      elements: [
        {
          type: 'Literal',
          value: 0
        },
        {
          type: 'Literal',
          value: 1
        }
      ]
    }
    const mockFn1 = jest.fn()

    traverse(ast1, {
      ArrayExpression(path) {
        const nodePaths = path.pushContainer('elements', [
          {
            type: 'Literal',
            value: 2
          },
          {
            type: 'Literal',
            value: 3
          },
        ])
        expect(nodePaths[0].key).toBe(2)
        expect(nodePaths[1].key).toBe(3)
        expect(nodePaths[0].listKey).toBe('elements')
        expect(nodePaths[1].listKey).toBe('elements')
      },
      Literal: mockFn1
    })

    expect(mockFn1).toBeCalledTimes(4)
    expect(ast1).toEqual({
      type: 'ArrayExpression',
      elements: [
        {
          type: 'Literal',
          value: 0
        },
        {
          type: 'Literal',
          value: 1
        },
        {
          type: 'Literal',
          value: 2
        },
        {
          type: 'Literal',
          value: 3
        }
      ]
    })

    const ast2 = {
      type: 'ArrayExpression',
      elements: []
    }
    const mockFn2 = jest.fn()

    traverse(ast2, {
      ArrayExpression(path) {
        const nodePaths = path.pushContainer('elements', [
          {
            type: 'Literal',
            value: 0
          },
          {
            type: 'Literal',
            value: 1
          },
        ])
        expect(nodePaths[0].key).toBe(0)
        expect(nodePaths[1].key).toBe(1)
        expect(nodePaths[0].listKey).toBe('elements')
        expect(nodePaths[1].listKey).toBe('elements')
      },
      Literal: mockFn2
    })

    expect(mockFn2).toBeCalledTimes(2)
    expect(ast2).toEqual({
      type: 'ArrayExpression',
      elements: [
        {
          type: 'Literal',
          value: 0
        },
        {
          type: 'Literal',
          value: 1
        }
      ]
    })
  })

  //#endregion

  //#region Family

  test('get', () => {
    const ast = {
      type: 'Program',
      sourceType: 'script',
      body: [
        {
          type: 'IfStatement',
          test: {
            type: 'Literal',
            value: 0
          },
          consequent: {
            type: 'BlockStatement',
            body: []
          },
          alternate: null
        },
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'Literal',
            value: true
          }
        }
      ]
    } as const

    traverse(ast, {
      Program(path) {
        const bodyNodePaths = path.get('body')

        expect(bodyNodePaths[0].node).toBe(ast.body[0])
        expect(bodyNodePaths[0].key).toBe(0)
        expect(bodyNodePaths[0].parent).toBe(ast)
        expect(bodyNodePaths[0].listKey).toBe('body')

        expect(bodyNodePaths[1].node).toBe(ast.body[1])
        expect(bodyNodePaths[1].key).toBe(1)
        expect(bodyNodePaths[1].parent).toBe(ast)
        expect(bodyNodePaths[1].listKey).toBe('body')

        expect(() => {
          // @ts-expect-error `get` function is invisible in the type system for null NodePaths, but it's there
          path.get('invalidKey').get('something')
        }).toThrow(/Can not use method `get` on a null NodePath/)
      },
      IfStatement(path) {
        const ifStatement = ast.body[0]
        expect(path.get('test').node).toBe(ifStatement.test)
        expect(path.get('test').key).toBe('test')
        expect(path.get('test').parent).toBe(ifStatement)
      }
    })

    expect.assertions(12)
  })

  test('getSibling', () => {
    const ast = {
      type: 'Program',
      sourceType: 'script',
      body: [
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'Literal',
            value: 1
          }
        },
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'Literal',
            value: 2
          }
        },
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'Literal',
            value: 3
          }
        },
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'AssignmentExpression',
            left: {
              type: 'Identifier',
              name: 'a'
            },
            operator: '=',
            right: {
              type: 'Identifier',
              name: 'b'
            }
          }
        }
      ]
    } as const

    traverse(ast, {
      Program(path) {
        expect(() => path.getSibling('some')).toThrow(/does not have a parent/)
      },
      ExpressionStatement(path) {
        if (
          path.node.expression.type === 'Literal' &&
          path.node.expression.value === 2
        ) {
          expect(path.getSibling(0).node).toBe(ast.body[0])
          expect(path.getSibling(2).node).toBe(ast.body[2])
        }
      },
      Identifier(path) {
        if (path.node.name === 'a') {
          expect(path.getSibling('right').node).toBe((path.parentPath.node as t.AssignmentExpression).right)
        }
      }
    })

    expect.assertions(4)
  })

  test('getOpposite', () => {
    const ast = {
      type: 'AssignmentExpression',
      left: {
        type: 'Identifier',
        name: 'a'
      },
      operator: '=',
      right: {
        type: 'Identifier',
        name: 'b'
      }
    }

    traverse(ast, {
      Identifier(path) {
        if (path.key === 'left') {
          expect(path.getOpposite().node).toBe(ast.right)
        } else if (path.key === 'right') {
          expect(path.getOpposite().node).toBe(ast.left)
        }
      }
    })

    expect.assertions(2)
  })

  test('getPrevSibling', () => {
    const ast = {
      type: 'ArrayExpression',
      elements: [
        {
          type: 'Literal',
          value: 1
        },
        {
          type: 'Literal',
          value: 2
        },
        {
          type: 'Literal',
          value: 3
        }
      ]
    }

    traverse(ast, {
      Literal(path) {
        if (path.node.value === 2) {
          expect(path.getPrevSibling().node).toBe(ast.elements[0])
        }
      }
    })

    expect.assertions(1)
  })

  test('getNextSibling', () => {
    const ast = {
      type: 'ArrayExpression',
      elements: [
        {
          type: 'Literal',
          value: 1
        },
        {
          type: 'Literal',
          value: 2
        },
        {
          type: 'Literal',
          value: 3
        }
      ]
    }

    traverse(ast, {
      Literal(path) {
        if (path.node.value === 2) {
          expect(path.getNextSibling().node).toBe(ast.elements[2])
        }
      }
    })

    expect.assertions(1)
  })

  test('getAllPrevSiblings', () => {
    const ast = {
      type: 'ArrayExpression',
      elements: [
        {
          type: 'Literal',
          value: 1
        },
        {
          type: 'Literal',
          value: 2
        },
        {
          type: 'Literal',
          value: 3
        },
        {
          type: 'Literal',
          value: 4
        },
        {
          type: 'Literal',
          value: 5
        }
      ]
    }

    traverse(ast, {
      ArrayExpression(path) {
        expect(() => path.getAllPrevSiblings()).toThrow(/does not have a parent/)
      },
      Literal(path) {
        if (path.node.value === 3) {
          const prevSiblings = path.getAllPrevSiblings()
          expect(prevSiblings[0].node).toBe(ast.elements[1])
          expect(prevSiblings[1].node).toBe(ast.elements[0])
        }
      }
    })

    expect.assertions(3)
  })

  test('getAllNextSiblings', () => {
    const ast = {
      type: 'ArrayExpression',
      elements: [
        {
          type: 'Literal',
          value: 1
        },
        {
          type: 'Literal',
          value: 2
        },
        {
          type: 'Literal',
          value: 3
        },
        {
          type: 'Literal',
          value: 4
        },
        {
          type: 'Literal',
          value: 5
        }
      ]
    }

    traverse(ast, {
      ArrayExpression(path) {
        expect(() => path.getAllNextSiblings()).toThrow(/does not have a parent/)
      },
      Literal(path) {
        if (path.node.value === 3) {
          const nextSiblings = path.getAllNextSiblings()
          expect(nextSiblings[0].node).toBe(ast.elements[3])
          expect(nextSiblings[1].node).toBe(ast.elements[4])
        }
      }
    })

    expect.assertions(3)
  })

  //#endregion

  //#region Introspection

  test('has', () => {
    const ast = {
      type: 'IfStatement',
      test: {
        type: 'Identifier',
        name: 'x'
      },
      consequent: {
        type: 'BlockStatement',
        body: []
      },
      alternate: null
    }

    traverse(ast, {
      IfStatement(path) {
        expect(path.has('consequent')).toBe(true)
        expect(path.has('alternate')).toBe(false)
      },
      BlockStatement(path) {
        expect(path.has('body')).toBe(false)
      }
    })

    expect.assertions(3)
  })

  test('is', () => {
    const ast = {
      type: 'Property',
      key: {
        type: 'Identifier',
        name: 'x'
      },
      value: {
        type: 'Identifier',
        name: 'x'
      },
      kind: 'init',
      computed: false,
      method: false,
      shorthand: true
    }

    traverse(ast, {
      Property(path) {
        expect(path.is('computed')).toBe(false)
        expect(path.is('shorthand')).toBe(true)
      }
    })

    expect.assertions(2)
  })

  //#endregion

  //#region Removal

  test('remove', () => {
    const ast1 = {
      type: 'IfStatement',
      test: {
        type: 'Literal',
        value: 0
      },
      consequent: {
        type: 'BlockStatement',
        body: []
      },
      alternate: {
        type: 'ExpressionStatement',
        expression: {
          type: 'Literal',
          value: true
        }
      }
    }

    traverse(ast1, {
      IfStatement(path) {
        expect(() => path.remove()).toThrow(/does not have a parent/)
      },
      ExpressionStatement(path) {
        path.remove()
        expect(() => path.remove()).toThrow(/already removed/)
      }
    })

    expect(ast1).toEqual({
      type: 'IfStatement',
      test: {
        type: 'Literal',
        value: 0
      },
      consequent: {
        type: 'BlockStatement',
        body: []
      },
      alternate: null
    })

    const ast2 = {
      type: 'Program',
      sourceType: 'script',
      body: [
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'Literal',
            value: 'string'
          }
        },
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'Literal',
            value: true
          }
        },
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'Literal',
            value: 1
          }
        },
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'Literal',
            value: 2
          }
        }
      ]
    }

    traverse(ast2, {
      ExpressionStatement(path) {
        const expressionNode = path.node.expression
        if (expressionNode.type === 'Literal') {
          if (typeof expressionNode.value === 'boolean') path.remove()
          if (expressionNode.value === 1) {
            expect(path.key).toBe(1)
          }
          if (expressionNode.value === 2) {
            expect(path.key).toBe(2)
          }
        }
      },
    })

    expect(ast2).toEqual({
      type: 'Program',
      sourceType: 'script',
      body: [
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'Literal',
            value: 'string'
          }
        },
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'Literal',
            value: 1
          }
        },
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'Literal',
            value: 2
          }
        }
      ]
    })

  })

  //#endregion

  //#region Replacement

  test('replaceWith', () => {
    const ast = {
      type: 'ArrayExpression',
      elements: [
        {
          type: 'Literal',
          value: 1
        },
        {
          type: 'Literal',
          value: 2
        },
        {
          type: 'Literal',
          value: 3
        }
      ]
    }
    let mockFn: jest.Mock<void, [NodePath<t.Literal>]>

    traverse(ast, {
      ArrayExpression(path) {
        expect(() => path.replaceWith({ type: 'EmptyStatement' })).toThrow(/does not have a parent/)
      },
      Literal: (mockFn = jest.fn((path) => {
        if (path.node.value === 2) {
          const newPath = path.replaceWith({
            type: 'Literal',
            value: null
          })

          expect(path.removed).toBe(true)
          expect(newPath.key).toBe(path.key)
          expect(newPath.listKey).toBe(path.listKey)
          expect(newPath.parentPath).toBe(path.parentPath)

          expect(() => path.replaceWith({ type: 'Literal', value: null })).toThrow(/already removed/)
        }
      }))
    })

    expect(mockFn).toBeCalledTimes(4)
    expect(ast).toEqual({
      type: 'ArrayExpression',
      elements: [
        {
          type: 'Literal',
          value: 1
        },
        {
          type: 'Literal',
          value: null
        },
        {
          type: 'Literal',
          value: 3
        }
      ]
    })
  })

  test('replaceWithMultiple', () => {
    const ast = {
      type: 'ArrayExpression',
      elements: [
        {
          type: 'Literal',
          value: 0
        }
      ]
    }
    let mockFn: jest.Mock<void, [NodePath<t.Literal>]>

    traverse(ast, {
      ArrayExpression(path) {
        expect(() => path.replaceWithMultiple([{ type: 'EmptyStatement' }])).toThrow()
      },
      Literal: (mockFn = jest.fn((path) => {
        if (path.node.value === 0) {
          const newPaths = path.replaceWithMultiple([
            {
              type: 'Literal',
              value: 1
            },
            {
              type: 'Literal',
              value: 2
            },
            {
              type: 'Literal',
              value: 3
            }
          ])
          expect(path.removed).toBe(true)
          expect(newPaths[0].key).toBe(0)
          expect(newPaths[1].key).toBe(1)
          expect(newPaths[2].key).toBe(2)

          expect(newPaths[0].listKey).toBe(path.listKey)
          expect(newPaths[1].listKey).toBe(path.listKey)
          expect(newPaths[2].listKey).toBe(path.listKey)

          expect(() => path.replaceWithMultiple([{ type: 'Literal', value: null }])).toThrow(/already removed/)
        }
      }))
    })

    expect(mockFn).toBeCalledTimes(4)
    expect(ast).toEqual({
      type: 'ArrayExpression',
      elements: [
        {
          type: 'Literal',
          value: 1
        },
        {
          type: 'Literal',
          value: 2
        },
        {
          type: 'Literal',
          value: 3
        }
      ]
    })
  })

  //#endregion
})

describe('Properties', () => {
  test('node', () => {
    const literalNode = {
      type: 'Literal',
      value: 0
    }
    const ast = {
      type: 'Program',
      sourceType: 'script',
      body: [
        {
          type: 'ExpressionStatement',
          expression: literalNode
        }
      ]
    }

    traverse(ast, {
      Literal(path) {
        expect(path.node).toBe(literalNode)
      }
    })

    expect.assertions(1)
  })

  test('type', () => {
    const ast = {
      type: 'Program',
      sourceType: 'script',
      body: [
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'Literal',
            value: 0
          }
        }
      ]
    }

    traverse(ast, {
      ExpressionStatement(path) {
        expect(path.type).toBe('ExpressionStatement')
      }
    })

    expect.assertions(1)
  })

  test('key', () => {
    const ast = {
      type: 'Program',
      sourceType: 'script',
      body: [
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'Literal',
            value: 0
          }
        }
      ]
    }

    traverse(ast, {
      Literal(path) {
        expect(path.key).toBe('expression')
      }
    })

    expect.assertions(1)
  })

  test('listKey', () => {
    const ast = {
      type: 'Program',
      sourceType: 'script',
      body: [
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'Literal',
            value: 0
          }
        }
      ]
    }

    traverse(ast, {
      ExpressionStatement(path) {
        expect(path.key).toBe(0)
        expect(path.listKey).toBe('body')
      }
    })

    expect.assertions(2)
  })

  test('parentKey', () => {
    const ast = {
      type: 'Program',
      sourceType: 'script',
      body: [
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'Literal',
            value: 0
          }
        }
      ]
    }

    traverse(ast, {
      Literal(path) {
        expect(path.parentKey).toBe('expression')
      },
      ExpressionStatement(path) {
        expect(path.parentKey).toBe('body')
      }
    })

    expect.assertions(2)
  })

  test('parentPath', () => {
    const ast = {
      type: 'Program',
      sourceType: 'script',
      body: [
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'Literal',
            value: 0
          }
        }
      ]
    }

    traverse(ast, {
      ExpressionStatement(path) {
        expect(path.parentPath.node).toBe(ast)
      }
    })

    expect.assertions(1)
  })

  test('parent', () => {
    const ast = {
      type: 'Program',
      sourceType: 'script',
      body: [
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'Literal',
            value: 0
          }
        }
      ]
    }

    traverse(ast, {
      ExpressionStatement(path) {
        expect(path.parent).toBe(ast)
      }
    })

    expect.assertions(1)
  })

  test('container', () => {
    const ast = {
      type: 'Program',
      sourceType: 'script',
      body: [
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'Literal',
            value: 0
          }
        }
      ]
    }

    traverse(ast, {
      ExpressionStatement(path) {
        expect(path.container).toBe(ast.body)
      },
      Literal(path) {
        expect(path.container).toBe(ast.body[0])
      }
    })

    expect.assertions(2)
  })

  test('removed', () => {
    const ast = {
      type: 'Program',
      sourceType: 'script',
      body: [
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'Literal',
            value: 0
          }
        }
      ]
    }

    traverse(ast, {
      ExpressionStatement(path) {
        path.remove()
        expect(path.removed).toBe(true)
      }
    })

    expect.assertions(1)
  })
})

describe('special cases', () => {
  test('syncs paths', () => {
    const ast = {
      type: 'Program',
      sourceType: 'module',
      body: [
        {
          type: 'BlockStatement',
          body: [
            {
              type: 'ExpressionStatement',
              expression: {
                type: 'Identifier',
                name: 'target',
                pattern: false
              }
            }
          ]
        }
      ]
    }

    let programPath: NodePath
    traverse(ast, { Program: (p) => programPath = p })

    programPath.traverse({
      BlockStatement(path) {
        path.replaceWithMultiple(path.node.body)
        expect(0).toBe(0)
      }
    })

    programPath.traverse({
      ExpressionStatement(path) {
        expect(path.parentPath).toBe(programPath)
      }
    })

    expect.assertions(2)
  })

  test('runs validation', () => {
    const ast = {
      type: 'ArrowFunctionExpression',
      params: [],
      body: {
        type: 'Literal',
        value: 0
      },
      async: false,
      expression: true
    }

    traverse(ast, {
      $: { validateNodes: true },
      ArrowFunctionExpression(path) {
        expect(() => path.pushContainer('params', [{ type: 'Identifier', name: 'a' }])).not.toThrowError()
        expect(() => path.unshiftContainer('params', [{
          type: 'RestElement',
          argument: {
            type: 'Identifier',
            name: 'rest'
          }
        }])).toThrowError()
      }
    })

    traverse(ast, {
      $: { validateNodes: false },
      ArrowFunctionExpression(path) {
        expect(() => path.unshiftContainer('params', [{
          type: 'RestElement',
          argument: {
            type: 'Identifier',
            name: 'rest'
          }
        }])).not.toThrowError()
      }
    })

    expect.assertions(3)
  })

  describe('removal cases', () => {
    test('"expression" of ExpressionStatement', () => {
      const ast = {
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'Identifier',
              name: 'target'
            }
          }
        ]
      }

      traverse(ast, {
        Identifier(path) {
          path.remove()
        }
      })

      expect(ast).toEqual({
        type: 'Program',
        sourceType: 'module',
        body: []
      })
    })

    test('"declaration" of ExportDeclaration', () => {
      const ast = {
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'ExportDefaultDeclaration',
            declaration: {
              type: 'Literal',
              value: 8
            }
          },
          {
            type: 'ExportNamedDeclaration',
            declaration: {
              type: 'VariableDeclaration',
              kind: 'const',
              declarations: [
                {
                  type: 'VariableDeclarator',
                  id: {
                    type: 'Identifier',
                    name: 'num'
                  },
                  init: {
                    type: 'Literal',
                    value: 6
                  }
                }
              ]
            },
            specifiers: [],
            source: null
          }
        ]
      }

      traverse(ast, {
        ExportDeclaration(path) {
          if (path.has('declaration')) {
            path.get<t.Node>('declaration').remove()
          }
        }
      })

      expect(ast).toEqual({
        type: 'Program',
        sourceType: 'module',
        body: []
      })
    })

    test('"test" of WhileStatement or SwitchCase', () => {
      const ast = {
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'WhileStatement',
            test: {
              type: 'Identifier',
              name: 'targetNode'
            },
            body: {
              type: 'BlockStatement',
              body: []
            }
          },
          {
            type: 'SwitchStatement',
            discriminant: {
              type: 'Identifier',
              name: 'x'
            },
            cases: [
              {
                type: 'SwitchCase',
                test: {
                  type: 'Identifier',
                  name: 'targetNode'
                },
                consequent: [
                  {
                    type: 'BreakStatement',
                    label: null
                  }
                ]
              }
            ]
          }
        ]
      }

      traverse(ast, {
        Identifier(path) {
          if (path.node.name === 'targetNode') {
            path.remove()
          }
        }
      })

      expect(ast).toEqual({
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'SwitchStatement',
            discriminant: {
              type: 'Identifier',
              name: 'x'
            },
            cases: []
          }
        ]
      })
    })

    test('"body" of LabeledStatement', () => {
      const ast = {
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'LabeledStatement',
            label: {
              type: 'Identifier',
              name: 'label'
            },
            body: {
              type: 'BlockStatement',
              body: []
            }
          }
        ]
      }

      traverse(ast, {
        BlockStatement(path) {
          path.remove()
        }
      })

      expect(ast).toEqual({
        type: 'Program',
        sourceType: 'module',
        body: []
      })
    })

    test('"declarations" of VariableDeclaration', () => {
      const ast = {
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'VariableDeclaration',
            kind: 'let',
            declarations: [
              {
                type: 'VariableDeclarator',
                id: {
                  type: 'Identifier',
                  name: 'a'
                },
                init: null
              }
            ]
          }
        ]
      }

      traverse(ast, {
        VariableDeclarator(path) {
          path.remove()
        }
      })

      expect(ast).toEqual({
        type: 'Program',
        sourceType: 'module',
        body: []
      })
    })

    test('child of BinaryExpression', () => {
      const ast = {
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'BinaryExpression',
              left: {
                type: 'Identifier',
                name: 'target'
              },
              right: {
                type: 'Literal',
                value: 1
              },
              operator: '+'
            }
          },
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'BinaryExpression',
              left: {
                type: 'Literal',
                value: 2
              },
              right: {
                type: 'Identifier',
                name: 'target'
              },
              operator: '+'
            }
          }
        ]
      }

      traverse(ast, {
        Identifier(path) {
          if (path.node.name === 'target') {
            path.remove()
          }
        }
      })

      expect(ast).toEqual({
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'Literal',
              value: 1
            }
          },
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'Literal',
              value: 2
            }
          }
        ]
      })
    })

    test('consequent of IfStatement', () => {
      const ast = {
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'IfStatement',
            test: {
              type: 'Identifier',
              name: 'x'
            },
            consequent: {
              type: 'ExpressionStatement',
              expression: {
                type: 'Identifier',
                name: 'target'
              }
            },
            alternate: null
          }
        ]
      }
      
      traverse(ast, {
        Identifier(path) {
          if (path.node.name === 'target') {
            path.remove()
          }
        }
      })

      expect(ast).toEqual({
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'IfStatement',
            test: {
              type: 'Identifier',
              name: 'x'
            },
            consequent: {
              type: 'BlockStatement',
              body: []
            },
            alternate: null
          }
        ]
      })
    })

    test('"body" of ArrowFunctionExpression or Loop', () => {
      const ast = {
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'ArrowFunctionExpression',
              params: [],
              body: {
                type: 'Literal',
                value: 5
              },
              async: false,
              expression: true
            }
          },
          {
            type: 'ForInStatement',
            body: {
              type: 'ExpressionStatement',
              expression: {
                type: 'Literal',
                value: 5
              }
            },
            left: {
              type: 'Identifier',
              name: 'x'
            },
            right: {
              type: 'Identifier',
              name: 'o'
            }
          },
          {
            type: 'ForOfStatement',
            left: {
              type: 'Identifier',
              name: 'x'
            },
            right: {
              type: 'Identifier',
              name: 'o'
            },
            body: {
              type: 'ExpressionStatement',
              expression: {
                type: 'Literal',
                value: 5
              }
            },
            await: false
          },
          {
            type: 'WhileStatement',
            test: {
              type: 'Identifier',
              name: 'x'
            },
            body: {
              type: 'ExpressionStatement',
              expression: {
                type: 'Literal',
                value: 5
              }
            }
          },
          {
            type: 'DoWhileStatement',
            body: {
              type: 'BlockStatement',
              body: [
                {
                  type: 'ExpressionStatement',
                  expression: {
                    type: 'Literal',
                    value: 5
                  }
                }
              ]
            },
            test: {
              type: 'Identifier',
              name: 'x'
            }
          }
        ]
      }

      traverse(ast, {
        ArrowFunctionExpression(path) {
          path.get('body').remove()
        },
        Loop(path) {
          path.get('body').remove()
        }
      })

      expect(ast).toEqual({
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'ArrowFunctionExpression',
              params: [],
              body: {
                type: 'BlockStatement',
                body: []
              },
              async: false,
              expression: false
            }
          },
          {
            type: 'ForInStatement',
            body: {
              type: 'BlockStatement',
              body: []
            },
            left: {
              type: 'Identifier',
              name: 'x'
            },
            right: {
              type: 'Identifier',
              name: 'o'
            }
          },
          {
            type: 'ForOfStatement',
            left: {
              type: 'Identifier',
              name: 'x'
            },
            right: {
              type: 'Identifier',
              name: 'o'
            },
            body: {
              type: 'BlockStatement',
              body: []
            },
            await: false
          },
          {
            type: 'WhileStatement',
            test: {
              type: 'Identifier',
              name: 'x'
            },
            body: {
              type: 'BlockStatement',
              body: []
            }
          },
          {
            type: 'DoWhileStatement',
            body: {
              type: 'BlockStatement',
              body: []
            },
            test: {
              type: 'Identifier',
              name: 'x'
            }
          }
        ]
      })
    })
  })
})
