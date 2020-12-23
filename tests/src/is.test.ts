import { is, traverse, types as t } from '<project>';

test('node', () => {
  const identifier: t.Node = { type: 'Identifier', name: 'x' };
  expect(is.identifier(identifier)).toBe(true);
  expect(is.literal(identifier)).toBe(false);
});

test('nodePath', () => {
  const ast: t.Node = { type: 'Identifier', name: 'x' };

  traverse(ast, {
    Identifier(path) {
      expect(is.identifier(path)).toBe(true);
      expect(is.literal(path)).toBe(false);
    }
  });
  
  expect.assertions(2);
});

describe('matcher', () => {
  test('primitive value', () => {
    const identifier: t.Node = { type: 'Identifier', name: 'x' };
    expect(is.identifier(identifier, { name: 'x' })).toBe(true);
    expect(is.identifier(identifier, { name: 'z' })).toBe(false);
  });

  test('function', () => {
    const identifier: t.Node = { type: 'Identifier', name: 'cool_name' };
    expect(is.identifier(identifier, { name: (v) => v.includes('cool') })).toBe(true);
    expect(is.identifier(identifier, { name: (v) => v.includes('not') })).toBe(false);
  });
});
