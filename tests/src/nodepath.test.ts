import { traverse } from '<project>';
import { Node, ExpressionStatement, AssignmentExpression, Literal } from 'estree';

describe('Methods', () => {
  test('findParent', () => {
    const ast: Node = {
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
    };

    traverse(ast, {
      Literal(path) {
        expect(
          path.findParent((parent) => parent.type === 'BlockStatement').node
        ).toBe(ast.body[0]);
      }
    });

    expect.assertions(1);
  });

  test('find', () => {
    const ast: Node = {
      type: 'ExpressionStatement',
      expression: {
        type: 'Literal',
        value: 0
      }
    };

    traverse(ast, {
      Literal(path) {
        expect(path.find((p) => p.type === 'Literal').node).toBe(ast.expression);
        expect(path.find((p) => p.type === 'ExpressionStatement').node).toBe(ast);
      }
    });

    expect.assertions(2);
  });

  test('getFunctionParent', () => {
    const ast: Node = {
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
    };

    traverse(ast, {
      Literal(path) {
        const { node: { value } } = path;
        if (value === 'arrow') {
          expect(path.getFunctionParent().node).toBe((ast.body[0] as ExpressionStatement).expression);
        } else if (value === 'expression') {
          expect(path.getFunctionParent().node).toBe(
            ((ast.body[1] as ExpressionStatement).expression as AssignmentExpression).right
          );
        } else if (value === 'declaration') {
          expect(path.getFunctionParent().node).toBe(ast.body[2]);
        }
      }
    });

    expect.assertions(3);
  });

  test('insertAfter', () => {
    const ast: Node = {
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
        }
      ]
    };

    traverse(ast, {
      ExpressionStatement(path) {
        const literal = path.node.expression as Literal;
        if (literal.value === 2) {
          expect(path.key).toBe(1);
          const nodePaths = path.insertAfter([
            {
              type: 'EmptyStatement',
            },
            {
              type: 'EmptyStatement',
            }
          ]);
          expect(nodePaths[0].key).toBe(2);
          expect(nodePaths[1].key).toBe(3);
        }
        if (literal.value === '3') {
          expect(path.key).toBe(4);
        }
      }
    });

    expect(ast).toEqual({
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
          type: 'EmptyStatement',
        },
        {
          type: 'EmptyStatement',
        },
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'Literal',
            value: 3
          }
        }
      ]
    });
  });

  describe('remove', () => {
    test('single', () => {
      const ast: Node = {
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
      };

      traverse(ast, {
        ExpressionStatement(path) {
          path.remove();
        }
      });

      expect(ast).toEqual({
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
      });
    });

    test('array', () => {
      const ast: Node = {
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
      };

      traverse(ast, {
        ExpressionStatement(path) {
          const expressionNode = path.node.expression;
          if (expressionNode.type === 'Literal') {
            if (typeof expressionNode.value === 'boolean') path.remove();
            if (expressionNode.value === 1) {
              expect(path.key).toBe(1);
            }
            if (expressionNode.value === 2) {
              expect(path.key).toBe(2);
            }
          }
        },
      });

      expect(ast).toEqual({
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
      });
    });
  });
});

describe('Properties', () => {
  test('node', () => {
    const literalNode: Node = {
      type: 'Literal',
      value: 0
    };
    const ast: Node = {
      type: 'Program',
      sourceType: 'script',
      body: [
        {
          type: 'ExpressionStatement',
          expression: literalNode
        }
      ]
    };

    traverse(ast, {
      Literal(path) {
        expect(path.node).toBe(literalNode);
      }
    });

    expect.assertions(1);
  });

  test('type', () => {
    const ast: Node = {
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
    };

    traverse(ast, {
      ExpressionStatement(path) {
        expect(path.type).toBe('ExpressionStatement');
      }
    });

    expect.assertions(1);
  });

  test('key', () => {
    const ast: Node = {
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
    };

    traverse(ast, {
      Literal(path) {
        expect(path.key).toBe('expression');
      }
    });

    expect.assertions(1);
  });

  test('listKey', () => {
    const ast: Node = {
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
    };

    traverse(ast, {
      ExpressionStatement(path) {
        expect(path.key).toBe(0);
        expect(path.listKey).toBe('body');
      }
    });

    expect.assertions(2);
  });

  test('parentPath', () => {
    const ast: Node = {
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
    };

    traverse(ast, {
      ExpressionStatement(path) {
        expect(path.parentPath.node).toBe(ast);
      }
    });

    expect.assertions(1);
  });

  test('parent', () => {
    const ast: Node = {
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
    };

    traverse(ast, {
      ExpressionStatement(path) {
        expect(path.parent).toBe(ast);
      }
    });

    expect.assertions(1);
  });

  test('container', () => {
    const ast: Node = {
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
    };

    traverse(ast, {
      ExpressionStatement(path) {
        expect(path.container).toBe(ast.body);
      },
      Literal(path) {
        expect(path.container).toBe(ast.body[0]);
      }
    });

    expect.assertions(2);
  });

  test('removed', () => {
    const ast: Node = {
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
    };

    traverse(ast, {
      ExpressionStatement(path) {
        path.remove();
        expect(path.removed).toBe(true);
      }
    });

    expect.assertions(1);
  });
});
