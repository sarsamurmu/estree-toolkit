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
        }
      ]
    };

    createTraverser({})(ast, {
      ExpressionStatement(path) {
        const expressionNode = path.node.expression;
        if (
          expressionNode.type === 'Literal' &&
          typeof expressionNode.value === 'boolean'
        ) path.remove();
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
            value: 'string'
          }
        }
      ]
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

    createTraverser({})(ast, {
      Literal(path) {
        expect(path.node).toBe(literalNode);
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

    createTraverser({})(ast, {
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

    createTraverser({})(ast, {
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

    createTraverser({})(ast, {
      ExpressionStatement(path) {
        expect(path.parentPath.node).toBe(ast);
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

    createTraverser({})(ast, {
      ExpressionStatement(path) {
        expect(path.type).toBe('ExpressionStatement');
      }
    });

    expect.assertions(1);
  });
});
