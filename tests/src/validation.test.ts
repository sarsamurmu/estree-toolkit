import { builders as b, NodePath, traverse } from '<project>';
import { NodeT } from '<project>/estree';

describe('identifier', () => {
  test('basic builder', () => {
    expect(() => b.identifier('const')).not.toThrow();
    expect(() => b.identifier('a b')).toThrow();
  });

  test('MemberExpression', () => {
    traverse({
      type: 'MemberExpression',
      object: {
        type: 'Identifier',
        name: 'a'
      },
      computed: false,
      property: {
        type: 'Identifier',
        name: 'b'
      }
    }, {
      MemberExpression(path) {
        expect(() => path.get('property').replaceWith(b.identifier('const'))).not.toThrow();
        expect(() => path.get('object').replaceWith(b.identifier('const'))).toThrow();
        path.node.computed = true;
        expect(() => path.get('property').replaceWith(b.identifier('const'))).toThrow();
      }
    });

    expect.assertions(3);
  });

  test('Property and MethodDefinition', () => {
    [
      [
        'Property',
        {
          type: 'Property',
          key: {
            type: 'Identifier',
            name: 'a'
          },
          value: {
            type: 'Literal',
            value: 0
          },
          kind: 'init',
          computed: false,
          method: false,
          shorthand: false
        }
      ] as const,
      [
        'MethodDefinition',
        {
          type: 'MethodDefinition',
          kind: 'method',
          static: false,
          computed: false,
          key: {
            type: 'Identifier',
            name: 'a'
          },
          decorators: [],
          value: {
            type: 'FunctionExpression',
            params: [],
            body: {
              type: 'BlockStatement',
              body: []
            },
            async: false,
            generator: false,
            id: null
          }
        }
      ] as const
    ].forEach(([type, ast]) => {
      traverse(ast, {
        [type]: (path: NodePath<NodeT<typeof type>>) => {
          expect(() => path.get('key').replaceWith(b.identifier('if'))).not.toThrow();
          path.node.computed = true;
          expect(() => path.get('key').replaceWith(b.identifier('if'))).toThrow();
        }
      });
    });

    expect.assertions(4);
  });

  test('ExportSpecifier', () => {
    traverse({
      type: 'ExportSpecifier',
      local: {
        type: 'Identifier',
        name: 'a'
      },
      exported: {
        type: 'Identifier',
        name: 'b'
      }
    }, {
      ExportSpecifier(path) {
        expect(() => path.get('exported').replaceWith(b.identifier('class'))).not.toThrow();
        expect(() => path.get('local').replaceWith(b.identifier('class'))).toThrow();
      }
    });

    expect.assertions(2);
  });

  test('ImportSpecifier', () => {
    traverse({
      type: 'ImportSpecifier',
      local: {
        type: 'Identifier',
        name: 'b'
      },
      imported: {
        type: 'Identifier',
        name: 'b'
      }
    }, {
      ImportSpecifier(path) {
        expect(() => path.get('imported').replaceWith(b.identifier('class'))).not.toThrow();
        expect(() => path.get('local').replaceWith(b.identifier('class'))).toThrow();
      }
    });

    expect.assertions(2);
  });

  test('MetaProperty', () => {
    traverse({
      type: 'MetaProperty',
      meta: {
        type: 'Identifier',
        name: 'import'
      },
      property: {
        type: 'Identifier',
        name: 'meta'
      }
    }, {
      MetaProperty(path) {
        expect(() => path.get('property').replaceWith(b.identifier('for'))).toThrow();
        expect(() => path.get('meta').replaceWith(b.identifier('while'))).toThrow();
        expect(() => path.get('property').replaceWith(b.identifier('meta'))).not.toThrow();
        expect(() => path.get('meta').replaceWith(b.identifier('import'))).not.toThrow();
      }
    });

    expect.assertions(4);
  });
});

test('TryStatement', () => {
  expect(() => {
    b.tryStatement(
      b.blockStatement([]),
      b.catchClause(b.identifier('e'), b.blockStatement([])),
      b.blockStatement([])
    )
  }).not.toThrow();
  expect(() => {
    b.tryStatement(
      b.blockStatement([]),
      null,
      b.blockStatement([])
    );
  }).not.toThrow();
  expect(() => {
    b.tryStatement(
      b.blockStatement([]),
      b.catchClause(b.identifier('e'), b.blockStatement([])),
      null
    )
  }).not.toThrow();
  expect(() => {
    b.tryStatement(
      b.blockStatement([]),
      null,
      null
    )
  }).toThrow('If `handler` is null then `finalizer` must be not null');
});

test('RestElement', () => {
  traverse({
    type: 'ArrowFunctionExpression',
    params: [
      {
        type: 'Identifier',
        name: 'a'
      },
      {
        type: 'Identifier',
        name: 'b'
      }
    ],
    body: {
      type: 'Literal',
      value: 0
    },
    async: false,
    expression: true
  }, {
    ArrowFunctionExpression(path) {
      const node = b.restElement(b.identifier('x'));
      const errRE = /RestElement should be the last children/;
      expect(() => path.get('params')[1].insertBefore([node])).toThrow(errRE);
      expect(() => path.get('params')[1].insertAfter([node])).not.toThrow();
      expect(() => path.get('params')[0].insertAfter([node])).toThrow(errRE);
      expect(() => path.pushContainer('params', [node])).not.toThrow();
      expect(() => path.unshiftContainer('params', [node])).toThrow(errRE);
    }
  });

  expect.assertions(5);
});
