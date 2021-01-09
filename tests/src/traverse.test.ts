import { NodePath, traverse } from '<project>';

test('basic traversal', () => {
  const ast = {
    type: 'Program',
    sourceType: 'module',
    body: [
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
            type: 'ArrayExpression',
            elements: [
              {
                type: 'Identifier',
                name: 'b'
              },
              {
                type: 'Identifier',
                name: 'c'
              }
            ]
          }
        }
      }
    ]
  } as const;
  const state = {};

  const mockFn = jest.fn<void, [NodePath, any]>();
  traverse(ast, {
    ArrayExpression: mockFn,
    AssignmentExpression: mockFn,
    ExpressionStatement: mockFn,
    Identifier: mockFn,
    Program: mockFn,
  }, state);

  const visitStack = [
    ast,
    ast.body[0],
    ast.body[0].expression,
    ast.body[0].expression.left,
    ast.body[0].expression.right,
    ast.body[0].expression.right.elements[0],
    ast.body[0].expression.right.elements[1]
  ];
  for (let i = 0; i < mockFn.mock.calls.length; i++) {
    const callArgs = mockFn.mock.calls[i];
    expect(callArgs[0].node).toBe(visitStack[i]);
    expect(callArgs[1]).toBe(state);
  }
});

describe('visitor expansion', () => {
  test('pipe separated visitors', () => {
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
                type: 'Identifier',
                name: 'a'
              },
              {
                type: 'Identifier',
                name: 'b'
              }
            ]
          }
        }
      ]
    } as const;
    const state = {};

    const mockFn = jest.fn<void, [NodePath, any]>();
    traverse(ast, {
      ['Program|Identifier' as any]: mockFn,
    }, state);

    const toMatch = [
      ast,
      ast.body[0].expression.elements[0],
      ast.body[0].expression.elements[1]
    ];
    for (let i = 0; i < mockFn.mock.calls.length; i++) {
      const callArgs = mockFn.mock.calls[i];
      expect(callArgs[0].node).toBe(toMatch[i]);
      expect(callArgs[1]).toBe(state);
    }
  });

  test('aliases', () => {
    const ast = {
      type: 'Program',
      sourceType: 'module',
      body: [
        {
          type: 'ClassDeclaration',
          id: {
            type: 'Identifier',
            name: 'x'
          },
          superClass: null,
          decorators: [],
          body: {
            type: 'ClassBody',
            body: []
          }
        },
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'ClassExpression',
            id: null,
            superClass: null,
            decorators: [],
            body: {
              type: 'ClassBody',
              body: []
            }
          }
        }
      ]
    } as const;
    const state = {};

    const mockFn = jest.fn<void, [NodePath, any]>();
    traverse(ast, {
      Class: mockFn,
    }, state);

    for (let i = 0; i < mockFn.mock.calls.length; i++) {
      const callArgs = mockFn.mock.calls[i];
      expect(callArgs[0].type).toMatch(/Class(Expression|Declaration)/);
      expect(callArgs[1]).toBe(state);
    }
  });

  test('overwrite visitor', () => {
    const ast = {
      type: 'Program',
      sourceType: 'module',
      body: []
    };

    const mockFn1 = jest.fn<void, [NodePath]>();
    const mockFn2 = jest.fn<void, [NodePath]>();
    const mockFn3 = jest.fn<void, [NodePath]>();
    traverse(ast, {
      Program: mockFn1,
      ['Program|1' as any]: mockFn2,
      ['Program|2' as any]: mockFn3,
    });

    expect(mockFn3).toHaveBeenCalledTimes(1);
    expect(mockFn1).toHaveBeenCalledTimes(0);
    expect(mockFn2).toHaveBeenCalledTimes(0);
  });
});

test('enter/leave object', () => {
  const ast = {
    type: 'Program',
    sourceType: 'module',
    body: []
  };
  const state = {};

  const enterFn = jest.fn<void, [NodePath, any]>();
  const leaveFn = jest.fn<void, [NodePath, any]>();
  traverse(ast, {
    Program: {
      enter: enterFn,
      leave: leaveFn
    }
  }, state);

  expect(enterFn).toHaveBeenCalledTimes(1);
  expect(leaveFn).toHaveBeenCalledTimes(1);
  expect(enterFn.mock.calls[0][0].node).toBe(ast);
  expect(enterFn.mock.calls[0][1]).toBe(state);
  expect(leaveFn.mock.calls[0][0].node).toBe(ast);
  expect(leaveFn.mock.calls[0][1]).toBe(state);
});

describe('stopping traversal does not traverse', () => {
  test('keyed children', () => {
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
        }
      ]
    };
    const mockFn = jest.fn();

    traverse(ast, {
      ArrayExpression() {
        this.stop();
      },
      Literal: mockFn
    });

    expect(mockFn).toBeCalledTimes(0);
  })
});
