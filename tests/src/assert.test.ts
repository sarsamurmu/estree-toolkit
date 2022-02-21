import * as a from '<project>/assert';

test('runValidation', () => {
  expect(() => a.runValidation(() => null, null)).not.toThrow();
  expect(() => {
    a.runValidation(() => '@error_message', null)
  }).toThrowError('@error_message');
});

test('chain', () => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const mock1 = jest.fn((_) => null);
  const mock2 = jest.fn((_) => null);
  const mock3 = jest.fn((_) => '@error_message');
  const mock4 = jest.fn();
  /* eslint-enable @typescript-eslint/no-unused-vars */

  expect(a.chain(mock1, mock2, mock3, mock4)(100)).toBe('@error_message');
  expect(mock1).toBeCalledTimes(1);
  expect(mock1.mock.calls[0][0]).toBe(100);
  expect(mock2).toBeCalledTimes(1);
  expect(mock2.mock.calls[0][0]).toBe(100);
  expect(mock3).toBeCalledTimes(1);
  expect(mock3.mock.calls[0][0]).toBe(100);
  expect(mock4).toBeCalledTimes(0);
});

describe('OR', () => {
  test('passes all', () => {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const mock1 = jest.fn((_) => null);
    const mock2 = jest.fn((_) => null);
    const mock3 = jest.fn((_) => null);
    /* eslint-enable @typescript-eslint/no-unused-vars */

    expect(a.OR(mock1, mock2, mock3)(54)).toBe(null);
    expect(mock1).toBeCalledTimes(1);
    expect(mock1.mock.calls[0][0]).toBe(54);
    expect(mock2).toBeCalledTimes(0);
    expect(mock3).toBeCalledTimes(0);
  });

  test('passes one', () => {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const mock1 = jest.fn((_) => '@error_1');
    const mock2 = jest.fn((_) => null);
    const mock3 = jest.fn((_) => '@error_2');
    /* eslint-enable @typescript-eslint/no-unused-vars */

    expect(a.OR(mock1, mock2, mock3)(44)).toBe(null);
    expect(mock1).toBeCalledTimes(1);
    expect(mock1.mock.calls[0][0]).toBe(44);
    expect(mock2).toBeCalledTimes(1);
    expect(mock2.mock.calls[0][0]).toBe(44);
    expect(mock3).toBeCalledTimes(0);
  });

  test('fails all', () => {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const mock1 = jest.fn((_) => '@error_1');
    const mock2 = jest.fn((_) => '@error_2');
    const mock3 = jest.fn((_) => '@error_3');
    /* eslint-enable @typescript-eslint/no-unused-vars */

    expect(a.OR(mock1, mock2, mock3)(40)).toContain('@error_1\n@error_2\n@error_3');
    expect(mock1).toBeCalledTimes(1);
    expect(mock1.mock.calls[0][0]).toBe(40);
    expect(mock2).toBeCalledTimes(1);
    expect(mock2.mock.calls[0][0]).toBe(40);
    expect(mock3).toBeCalledTimes(1);
    expect(mock3.mock.calls[0][0]).toBe(40);
  });
});

describe('value', () => {
  test('single', () => {
    expect(a.value('number')(77)).toBeNull();
    expect(a.value('string')(77 as any)).toMatch('Expected the value to be a');
  });

  test('multiple', () => {
    expect(a.value('number', 'string')(77)).toBeNull();
    expect(a.value('number', 'string')('test')).toBeNull();
    expect(a.value('number', 'string')(true as any)).toMatch('Expected the value to be one of');
  });

  test('null', () => {
    expect(a.value('number', 'null')(77)).toBeNull();
    expect(a.value('number', 'null')(null)).toBeNull();
    expect(a.value('number', 'null')(true as any)).toMatch('Expected the value to be one of');
  });
});

test('isReserved', () => {
  'try catch if while const let'.split(' ').forEach((keyword) => {
    expect(a.isReserved(keyword)).toBe(true);
  });
  'some unreserved identifiers'.split(' ').forEach((keyword) => {
    expect(a.isReserved(keyword)).toBe(false);
  });
  expect.assertions(9);
});

test('isValidIdentifier', () => {
  const validate = a.validIdentifier(false);
  expect(validate('a b')).toMatch('not a valid identifier');
  expect(validate('a-b')).toMatch('not a valid identifier');
  expect(validate('')).toMatch('not a valid identifier');
  expect(validate('1_')).toMatch('not a valid identifier');
  expect(validate('a_b')).toBe(null);
  expect(validate('try')).toBe(null);
  const jsxValidate = a.validIdentifier(true);
  expect(jsxValidate('a-b')).toBe(null);
});

test('nonNull', () => {
  expect(a.nonNull(2)).toBe(null);
  expect(a.nonNull(null)).toMatch('Expected the value to be non-null');
});

test('node', () => {
  expect(a.node('Identifier')({ type: 'Identifier', name: 'x' })).toBe(null);
  expect(a.node('Identifier', 'EmptyStatement')({ type: 'EmptyStatement' })).toBe(null);
  expect(a.node('Identifier')(null)).toMatch('Expected a "Identifier" node');
  expect(a.node('Identifier')({ type: 'EmptyStatement' } as any)).toMatch('Expected a "Identifier" node');
  expect(a.node('Identifier', 'Literal')({ type: 'EmptyStatement' } as any)).toMatch('Expected one of');
});

test('nodeAlias', () => {
  expect(a.nodeAlias('Class')({ type: 'ClassExpression' } as any)).toBe(null);
  expect(a.nodeAlias('Class')({ type: 'ClassDeclaration' } as any)).toBe(null);
  expect(a.nodeAlias('Class')({ type: 'Identifier' } as any)).toMatch('Expected one of');
});

test('any', () => {
  expect(a.any(0)).toBe(null);
});

test('arrayOf', () => {
  expect(a.arrayOf(a.any)(null)).toMatch('Expected the value to be an array');
  expect(a.arrayOf(a.any)([])).toBe(null);
  expect(a.arrayOf(a.value('boolean'))([true, false, true])).toBe(null);
  expect(a.arrayOf(a.value('number'))([1, 2, 3, false as any])).toMatch('Got unexpected value at index 3');
});

test('oneOf', () => {
  expect(a.oneOf([1, 3, 5])(1)).toBe(null);
  expect(a.oneOf([1, 3, 5])(2)).toMatch('Expected the value to be one of');
});

test('nullable', () => {
  expect(a.nullable(a.value('number'))(null)).toBe(null);
  expect(a.nullable(a.value('number'))(55)).toBe(null);
  expect(a.nullable(a.value('number'))({} as any)).toMatch('Expected the value to be a');
});
