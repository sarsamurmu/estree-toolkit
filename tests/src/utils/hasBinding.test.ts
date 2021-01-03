import { parseModule } from 'meriyah';

import { traverse, utils as u } from '<project>';

test('variable declaration', () => {
  const ast = parseModule(`
    let a;
    const { b: [c, { d }], e, f = 0, ...g } = a;

    {
      targetNode
    }
  `);

  traverse(ast, {
    Identifier(path) {
      if (path.node.name !== 'targetNode') return;
      expect(u.hasBinding(path, 'a')).toBe(true);
      expect(u.hasBinding(path, 'b')).toBe(false);
      expect(u.hasBinding(path, 'c')).toBe(true);
      expect(u.hasBinding(path, 'd')).toBe(true);
      expect(u.hasBinding(path, 'e')).toBe(true);
      expect(u.hasBinding(path, 'f')).toBe(true);
      expect(u.hasBinding(path, 'g')).toBe(true);
    }
  });

  expect.assertions(7);
});

test('function parameters', () => {
  const ast = parseModule(`
    {
      function fn(a, { b: [c, { d }], e }, f = 0, ...g) {
        targetNode;
      }
    }

    {
      ({
        fn(a, { b: [c, { d }], e }, f = 0, ...g) {
          targetNode;
        }
      })
    }

    {
      (a, { b: [c, { d }], e }, f = 0, ...g) => {
        targetNode;
      }
    }
  `);

  traverse(ast, {
    Identifier(path) {
      if (path.node.name !== 'targetNode') return;
      expect(u.hasBinding(path, 'a')).toBe(true);
      expect(u.hasBinding(path, 'b')).toBe(false);
      expect(u.hasBinding(path, 'c')).toBe(true);
      expect(u.hasBinding(path, 'd')).toBe(true);
      expect(u.hasBinding(path, 'e')).toBe(true);
      expect(u.hasBinding(path, 'f')).toBe(true);
      expect(u.hasBinding(path, 'g')).toBe(true);
    }
  });

  expect.assertions(3 * 7);
});

test('function declaration', () => {
  const ast = parseModule(`
    {
      function a() {
        targetNode;
      }
    }

    {
      function a() {}
      targetNode;
    }
  `);

  traverse(ast, {
    Identifier(path) {
      if (path.node.name !== 'targetNode') return;
      expect(u.hasBinding(path, 'a')).toBe(true);
    }
  });

  expect.assertions(2 * 1);
});

test('class declaration', () => {
  const ast = parseModule(`
    {
      class a {
        method() {
          targetNode;
        }
      }
    }

    {
      class a {}
      targetNode;
    }
  `);

  traverse(ast, {
    Identifier(path) {
      if (path.node.name !== 'targetNode') return;
      expect(u.hasBinding(path, 'a')).toBe(true);
    }
  });

  expect.assertions(2 * 1);
});

test('function and class expression', () => {
  const ast = parseModule(`
    {
      ({
        fn: function a() {
          targetNode;
        }
      })
    }

    {
      ({
        _class: class a {
          constructor() {
            targetNode;
          }
        }
      })
    }
  `);

  traverse(ast, {
    Identifier(path) {
      if (path.node.name !== 'targetNode') return;
      expect(u.hasBinding(path, 'a')).toBe(true);
    }
  });

  expect.assertions(1 * 2);
});

test('import declaration', () => {
  const ast = parseModule(`
    import a, { b, c as d } from '';
    import * as e from '';

    targetNode;
  `);

  traverse(ast, {
    Identifier(path) {
      if (path.node.name !== 'targetNode') return;
      expect(u.hasBinding(path, 'a')).toBe(true);
      expect(u.hasBinding(path, 'b')).toBe(true);
      expect(u.hasBinding(path, 'c')).toBe(false);
      expect(u.hasBinding(path, 'd')).toBe(true);
      expect(u.hasBinding(path, 'e')).toBe(true);
    }
  });

  expect.assertions(5);
});

test('for statement', () => {
  const ast = parseModule(`
    for (let a = 0, b = 0;;) {
      targetNode;
    }
  `);

  traverse(ast, {
    Identifier(path) {
      if (path.node.name !== 'targetNode') return;
      expect(u.hasBinding(path, 'a')).toBe(true);
      expect(u.hasBinding(path, 'b')).toBe(true);
    }
  });

  expect.assertions(2);
});

test('for..in and for..of statement', () => {
  const ast = parseModule(`
    for (const { a: [b, { c }], d, e = 0, ...f } in o) {
      targetNode;
    }

    for (const { a: [b, { c }], d, e = 0, ...f } of o) {
      targetNode;
    }
  `);

  traverse(ast, {
    Identifier(path) {
      if (path.node.name !== 'targetNode') return;
      expect(u.hasBinding(path, 'a')).toBe(false);
      expect(u.hasBinding(path, 'b')).toBe(true);
      expect(u.hasBinding(path, 'c')).toBe(true);
      expect(u.hasBinding(path, 'd')).toBe(true);
      expect(u.hasBinding(path, 'e')).toBe(true);
      expect(u.hasBinding(path, 'f')).toBe(true);
    }
  });

  expect.assertions(2 * 6);
});
