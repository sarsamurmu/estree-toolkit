import { createTraverser } from '<project>';
import { Node } from 'estree';

describe('Removal', () => {
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

    createTraverser({})(ast, {
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

  test.todo('array');
});
