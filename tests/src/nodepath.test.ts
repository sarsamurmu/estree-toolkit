import { traverse } from '<project>';
import { Node, ExpressionStatement, AssignmentExpression, Literal, IfStatement } from 'estree';

describe('Methods', () => {
  //#region Ancestry

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

  //#endregion

  //#region Modification

  test('insertBefore', () => {
    const ast: Node = {
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
    };

    traverse(ast, {
      Literal(path) {
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
          ]);
          expect(path.key).toBe(3);
          expect(nodePaths[0].key).toBe(1);
          expect(nodePaths[1].key).toBe(2);
        }
        if (path.node.value === 3) {
          expect(path.key).toBe(4);
        }
      }
    });

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
    });
  });

  test('insertAfter', () => {
    const ast: Node = {
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
    };

    traverse(ast, {
      Literal(path) {
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
          ]);
          expect(path.key).toBe(1);
          expect(nodePaths[0].key).toBe(2);
          expect(nodePaths[1].key).toBe(3);
        }
        if (path.node.value === 3) {
          expect(path.key).toBe(4);
        }
      }
    });

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
    });
  });

  test('unshiftContainer', () => {
    const ast1: Node = {
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
    };

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
        ]);
        expect(nodePaths[0].key).toBe(0);
        expect(nodePaths[1].key).toBe(1);
        expect(nodePaths[0].listKey).toBe('elements');
        expect(nodePaths[1].listKey).toBe('elements');
      }
    });

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
    });

    const ast2: Node = {
      type: 'ArrayExpression',
      elements: []
    };

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
        ]);
        expect(nodePaths[0].key).toBe(0);
        expect(nodePaths[1].key).toBe(1);
        expect(nodePaths[0].listKey).toBe('elements');
        expect(nodePaths[1].listKey).toBe('elements');
      }
    });

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
    });
  });

  test('insertContainer', () => {
    const ast1: Node = {
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
    };

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
        ]);
        expect(nodePaths[0].key).toBe(2);
        expect(nodePaths[1].key).toBe(3);
        expect(nodePaths[0].listKey).toBe('elements');
        expect(nodePaths[1].listKey).toBe('elements');
      }
    });

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
    });

    const ast2: Node = {
      type: 'ArrayExpression',
      elements: []
    };

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
        ]);
        expect(nodePaths[0].key).toBe(0);
        expect(nodePaths[1].key).toBe(1);
        expect(nodePaths[0].listKey).toBe('elements');
        expect(nodePaths[1].listKey).toBe('elements');
      }
    });

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
    });
  });

  //#endregion

  //#region Family

  test('get', () => {
    const ast: Node = {
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
    };

    traverse(ast, {
      Program(path) {
        const bodyNodePaths = path.get('body');

        expect(bodyNodePaths[0].node).toBe(ast.body[0]);
        expect(bodyNodePaths[0].key).toBe(0);
        expect(bodyNodePaths[0].parent).toBe(ast);
        expect(bodyNodePaths[0].listKey).toBe('body');

        expect(bodyNodePaths[1].node).toBe(ast.body[1]);
        expect(bodyNodePaths[1].key).toBe(1);
        expect(bodyNodePaths[1].parent).toBe(ast);
        expect(bodyNodePaths[1].listKey).toBe('body');
      },
      IfStatement(path) {
        const ifStatement = ast.body[0] as IfStatement;
        expect(path.get('test').node).toBe(ifStatement.test);
        expect(path.get('test').key).toBe('test');
        expect(path.get('test').parent).toBe(ifStatement);
      }
    });

    expect.assertions(11);
  });

  test('getSibling', () => {
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
    };

    traverse(ast, {
      ExpressionStatement(path) {
        if (
          path.node.expression.type === 'Literal' &&
          path.node.expression.value === 2
        ) {
          expect(path.getSibling(0).node).toBe(ast.body[0]);
          expect(path.getSibling(2).node).toBe(ast.body[2]);
        }
      },
      Identifier(path) {
        if (path.node.name === 'a') {
          expect(path.getSibling('right').node).toBe((path.parentPath.node as AssignmentExpression).right);
        }
      }
    });

    expect.assertions(3);
  });

  test('getOpposite', () => {
    const ast: Node = {
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
    };

    traverse(ast, {
      Identifier(path) {
        if (path.key === 'left') {
          expect(path.getOpposite().node).toBe(ast.right);
        } else if (path.key === 'right') {
          expect(path.getOpposite().node).toBe(ast.left);
        }
      }
    });

    expect.assertions(2);
  });

  test('getPrevSibling', () => {
    const ast: Node = {
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
    };

    traverse(ast, {
      Literal(path) {
        if (path.node.value === 2) {
          expect(path.getPrevSibling().node).toBe(ast.elements[0]);
        }
      }
    });

    expect.assertions(1);
  });

  test('getPrevSibling', () => {
    const ast: Node = {
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
    };

    traverse(ast, {
      Literal(path) {
        if (path.node.value === 2) {
          expect(path.getNextSibling().node).toBe(ast.elements[2]);
        }
      }
    });

    expect.assertions(1);
  });

  test('getAllPrevSiblings', () => {
    const ast: Node = {
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
    };

    traverse(ast, {
      Literal(path) {
        if (path.node.value === 3) {
          const prevSiblings = path.getAllPrevSiblings();
          expect(prevSiblings[0].node).toBe(ast.elements[1]);
          expect(prevSiblings[1].node).toBe(ast.elements[0]);
        }
      }
    });

    expect.assertions(2);
  });

  test('getAllNextSiblings', () => {
    const ast: Node = {
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
    };

    traverse(ast, {
      Literal(path) {
        if (path.node.value === 3) {
          const nextSiblings = path.getAllNextSiblings();
          expect(nextSiblings[0].node).toBe(ast.elements[3]);
          expect(nextSiblings[1].node).toBe(ast.elements[4]);
        }
      }
    });

    expect.assertions(2);
  });

  //#endregion

  //#region Removal

  test('remove', () => {
    const ast1: Node = {
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

    traverse(ast1, {
      ExpressionStatement(path) {
        path.remove();
      }
    });

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
    });


    const ast2: Node = {
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

    traverse(ast2, {
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
    });

  });

  //#endregion

  //#region Replacement

  test('replaceWith', () => {
    const ast: Node = {
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
    };

    traverse(ast, {
      Literal(path) {
        if (path.node.value === 2) {
          const newPath = path.replaceWith({
            type: 'Literal',
            value: null
          });

          expect(path.removed).toBe(true);
          expect(newPath.key).toBe(path.key);
          expect(newPath.listKey).toBe(path.listKey);
          expect(newPath.parentPath).toBe(path.parentPath);
        }
      }
    });

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
    });
  });

  test('replaceWithMultiple', () => {
    const ast: Node = {
      type: 'ArrayExpression',
      elements: [
        {
          type: 'Literal',
          value: 0
        }
      ]
    };

    traverse(ast, {
      Literal(path) {
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
          ]);
          expect(path.removed).toBe(true);
          expect(newPaths[0].key).toBe(0);
          expect(newPaths[1].key).toBe(1);
          expect(newPaths[2].key).toBe(2);

          expect(newPaths[0].listKey).toBe(path.listKey);
          expect(newPaths[1].listKey).toBe(path.listKey);
          expect(newPaths[2].listKey).toBe(path.listKey);
        }
      }
    });

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
    });
  });

  //#endregion
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
