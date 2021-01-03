import { parseModule } from 'meriyah';

import { traverse, utils as u } from '<project>';

describe('evaluate', () => {
  test('`undefined` variable', () => {
    const ast = parseModule('undefined');

    traverse(ast, {
      Identifier(path) {
        expect(u.evaluate(path)).toEqual({ value: undefined });
      }
    });

    expect.assertions(1);
  });

  test('Literal', () => {
    const ast = parseModule('70');

    traverse(ast, {
      Literal(path) {
        expect(u.evaluate(path)).toEqual({ value: 70 });
      }
    });

    expect.assertions(1);
  });

  describe('Binary expressions', () => {
    test.each([
      ['==', '1', '"1"', true],
      ['!=', '1', '"1"', false],
      ['===', '1', '"1"', false],
      ['!==', '1', '"1"', true],
      ['<', '1', '1', false],
      ['<=', '1', '1', true],
      ['>', '1', '1', false],
      ['>=', '1', '1', true],
      ['<<', '1', '2', 4],
      ['>>', '4', '1', 2],
      ['>>>', '10', '1', 5],
      ['+', '1', '1', 2],
      ['-', '1', '1', 0],
      ['*', '1', '1', 1],
      ['/', '1', '1', 1],
      ['%', '3', '2', 1],
      ['**', '2', '3', 8],
      ['|', '2', '1', 3],
      ['^', '2', '2', 0],
      ['&', '2', '2', 2]
    ])('%s', (operator, left, right, expected) => {
      const ast = parseModule(`${left} ${operator} ${right}`);

      traverse(ast, {
        BinaryExpression(path) {
          expect(u.evaluate(path)).toEqual({ value: expected });
        }
      });

      expect.assertions(1);
    });

    test.todo('in');

    test('unknown', () => {
      ['1 - unknown', 'unknown / 2'].forEach((expression) => {
        const ast = parseModule(expression);

        traverse(ast, {
          BinaryExpression(path) {
            expect(u.evaluate(path)).toBeUndefined();
          }
        })
      });

      expect.assertions(2);
    });
  });

  describe('Logical expressions', () => {
    test('&&', () => {
      (
        [
          ['false && unknown', { value: false }],
          ['true && false', { value: false }],
          ['true && true', { value: true }],
          ['unknown && true', undefined]
        ] as [string, { value: unknown } | undefined][]
      ).forEach(([expression, expected]) => {
        const ast = parseModule(expression);

        traverse(ast, {
          LogicalExpression(path) {
            expect(u.evaluate(path)).toEqual(expected);
          }
        });
      });

      expect.assertions(4);
    });

    test('||', () => {
      (
        [
          ['unknown || true', { value: true }],
          ['true || false', { value: true }],
          ['false || false', { value: false }],
          ['unknown || false', undefined]
        ] as [string, { value: unknown } | undefined][]
      ).forEach(([expression, expected]) => {
        const ast = parseModule(expression);

        traverse(ast, {
          LogicalExpression(path) {
            expect(u.evaluate(path)).toEqual(expected);
          }
        });
      });

      expect.assertions(4);
    });

    test('??', () => {
      (
        [
          ['false ?? true', { value: false }],
          ['null ?? false', { value: false }],
          ['undefined ?? false', { value: false }],
          ['unknown ?? false', undefined],
          ['null ?? unknown', undefined]
        ] as [string, { value: unknown } | undefined][]
      ).forEach(([expression, expected]) => {
        const ast = parseModule(expression);

        traverse(ast, {
          LogicalExpression(path) {
            expect(u.evaluate(path)).toEqual(expected);
          }
        });
      });

      expect.assertions(5);
    });
  });
});

describe('evaluateTruthy', () => {
  test('returns true', () => {
    const ast = parseModule('1 + 1');

    traverse(ast, {
      BinaryExpression(path) {
        expect(u.evaluateTruthy(path)).toBe(true);
      }
    });

    expect.assertions(1);
  });

  test('returns false', () => {
    const ast = parseModule('1 - 1');

    traverse(ast, {
      BinaryExpression(path) {
        expect(u.evaluateTruthy(path)).toBe(false);
      }
    });

    expect.assertions(1);
  });

  test('returns undefined', () => {
    const ast = parseModule('1 + unknown');

    traverse(ast, {
      BinaryExpression(path) {
        expect(u.evaluateTruthy(path)).toBeUndefined();
      }
    });

    expect.assertions(1);
  });
});
