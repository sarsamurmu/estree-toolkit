import { Node } from 'estree';

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

  const nodes: Node[] = [];
  const addToArr = (path: NodePath) => {
    nodes.push(path.node);
  }
  traverse(ast, {
    ArrayExpression: addToArr,
    AssignmentExpression: addToArr,
    ExpressionStatement: addToArr,
    Identifier: addToArr,
    Program: addToArr,
  });

  const toMatch = [
    ast,
    ast.body[0],
    ast.body[0].expression,
    ast.body[0].expression.left,
    ast.body[0].expression.right,
    ast.body[0].expression.right.elements[0],
    ast.body[0].expression.right.elements[1]
  ];
  for (let i = 0; i < nodes.length; i++) {
    expect(nodes[i] === toMatch[i]).toEqual(true);
  }
});
