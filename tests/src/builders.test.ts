import { builders as b, types as t } from '<project>';

test('basic', () => {
  expect(b.identifier('x')).toEqual<t.Identifier>({
    type: 'Identifier',
    name: 'x'
  });
});

test('optional fields', () => {
  expect(
    b.property('init', b.identifier('key'), b.identifier('value'))
  ).toEqual(expect.objectContaining({
    type: 'Property',
    kind: 'init',
    key: {
      type: 'Identifier',
      name: 'key'
    },
    value: {
      type: 'Identifier',
      name: 'value'
    },
    computed: false,
    shorthand: false
  }));
});

test('optional computed fields', () => {
  expect(b.importSpecifier(b.identifier('imp'))).toEqual<t.ImportSpecifier>({
    type: 'ImportSpecifier',
    imported: {
      type: 'Identifier',
      name: 'imp'
    },
    local: {
      type: 'Identifier',
      name: 'imp'
    }
  });
});
