import { parseModule } from 'meriyah'

import { traverse, utils as u } from '<project>'

describe('evaluate', () => {
  test('`undefined` variable', () => {
    const ast = parseModule('undefined')

    traverse(ast, {
      Identifier(path) {
        expect(u.evaluate(path)).toEqual({ value: undefined })
      }
    })

    expect.assertions(1)
  })

  test('Literal', () => {
    const ast = parseModule('70')

    traverse(ast, {
      Literal(path) {
        expect(u.evaluate(path)).toEqual({ value: 70 })
      }
    })

    expect.assertions(1)
  })

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
      ['&', '2', '2', 2],
      ['in', "'a'", '({ a: 0 })', true]
    ])('%s', (operator, left, right, expected) => {
      const ast = parseModule(`${left} ${operator} ${right}`)

      traverse(ast, {
        BinaryExpression(path) {
          expect(u.evaluate(path)).toEqual({ value: expected })
        }
      })

      expect.assertions(1)
    })

    test('instanceof', () => {
      // The code is not right, anyway `instanceof` evaluation is not supported,
      // so it would return `undefined` no matter what
      const ast = parseModule('1 instanceof 2')

      traverse(ast, {
        BinaryExpression(path) {
          expect(u.evaluate(path)).toBeUndefined()
        }
      })

      expect.assertions(1)
    })

    test('unknown binding', () => {
      ['1 - unknown', 'unknown / 2'].forEach((expression) => {
        const ast = parseModule(expression)

        traverse(ast, {
          BinaryExpression(path) {
            expect(u.evaluate(path)).toBeUndefined()
          }
        })
      })

      expect.assertions(2)
    })
  })

  describe('Unary expressions', () => {
    test.each([
      ['+', '"1"', 1],
      ['-', '"1"', -1],
      ['!', 'true', false],
      ['~', '1.3', -2],
      ['typeof', '5', 'number'],
      ['void', '2', undefined]
    ])('%s', (operator, argument, expected) => {
      const ast = parseModule(`${operator} ${argument}`)

      traverse(ast, {
        UnaryExpression(path) {
          expect(u.evaluate(path)).toEqual({ value: expected })
        }
      })

      expect.assertions(1)
    })

    test('delete and unknown binding', () => {
      ['delete 45', '!unknown'].forEach((expression) => {
        const ast = parseModule(expression)

        traverse(ast, {
          UnaryExpression(path) {
            expect(u.evaluate(path)).toBeUndefined()
          }
        })
      })

      expect.assertions(2)
    })
  })

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
        const ast = parseModule(expression)

        traverse(ast, {
          LogicalExpression(path) {
            expect(u.evaluate(path)).toEqual(expected)
          }
        })
      })

      expect.assertions(4)
    })

    test('||', () => {
      (
        [
          ['unknown || true', { value: true }],
          ['true || false', { value: true }],
          ['false || false', { value: false }],
          ['unknown || false', undefined]
        ] as [string, { value: unknown } | undefined][]
      ).forEach(([expression, expected]) => {
        const ast = parseModule(expression)

        traverse(ast, {
          LogicalExpression(path) {
            expect(u.evaluate(path)).toEqual(expected)
          }
        })
      })

      expect.assertions(4)
    })

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
        const ast = parseModule(expression)

        traverse(ast, {
          LogicalExpression(path) {
            expect(u.evaluate(path)).toEqual(expected)
          }
        })
      })

      expect.assertions(5)
    })
  })

  describe('ObjectExpression', () => {
    test('basic', () => {
      const ast = parseModule(`
        ({
          a: 1, b: 2,
          m: {
            c: 1, d: 2,
            x: { e: 0, f: 5 }
          }
        })
      `)

      traverse(ast, {
        ObjectExpression(path) {
          if (path.parent.type !== 'ExpressionStatement') return
          expect(u.evaluate(path)).toEqual({
            value: {
              a: 1, b: 2,
              m: {
                c: 1, d: 2,
                x: { e: 0, f: 5 }
              }
            }
          })
        }
      })

      expect.assertions(1)
    })

    test('computed key', () => {
      const ast = parseModule(`
        ({
          ['a' + 'b']: 2 + 2,
          [1 + 2]: 4 / 2
        })
      `)

      traverse(ast, {
        ObjectExpression(path) {
          expect(u.evaluate(path)).toEqual({
            value: { ab: 4, 3: 2 }
          })
        }
      })

      expect.assertions(1)
    })

    test('spread element', () => {
      const ast = parseModule(`
        ({
          a: 1,
          b: 2,
          ...({ c: 0, d: 1, x: { p: 0 } })
        })
      `)

      traverse(ast, {
        ObjectExpression(path) {
          if (path.parent.type !== 'ExpressionStatement') return
          expect(u.evaluate(path)).toEqual({
            value: { a: 1, b: 2, c: 0, d: 1, x: { p: 0 } }
          })
        }
      })

      expect.assertions(1)
    })

    test('unknown binding', () => {
      [
        '({ a: 1, b: x })',
        '({ ...x })',
        '({ set x(v) {} })',
        '({ [x]: 0 })'
      ].forEach((code) => {
        traverse(parseModule(code), {
          ObjectExpression(path) {
            if (path.parent.type !== 'ExpressionStatement') return
            expect(u.evaluate(path)).toBeUndefined()
          }
        })
      })

      expect.assertions(4)
    })
  })

  describe('ArrayExpression', () => {
    test('basic', () => {
      const ast = parseModule(`
        [1, 2, ['3', '4'], 5, 6]
      `)

      traverse(ast, {
        ArrayExpression(path) {
          if (path.parent.type !== 'ExpressionStatement') return
          expect(u.evaluate(path)).toEqual({ value: [1, 2, ['3', '4'], 5, 6] })
        }
      })

      expect.assertions(1)
    })

    test('unknown binding', () => {
      const ast = parseModule(`
        [1, 2, ['3', x], 5, 6]
      `)

      traverse(ast, {
        ArrayExpression(path) {
          if (path.parent.type !== 'ExpressionStatement') return
          expect(u.evaluate(path)).toBeUndefined()
        }
      })

      expect.assertions(1)
    })
  })

  describe('ConditionalExpression', () => {
    test('basic', () => {
      ([
        ['true ? 1 : 2', 1],
        ['false ? 1 : 2', 2],
        ['1 ? 1 : x', 1],
        ['0 ? x : 0', 0]
      ] as const).forEach(([code, expected]) => {
        traverse(parseModule(code), {
          ConditionalExpression(path) {
            expect(u.evaluate(path)).toEqual({ value: expected })
          }
        })
      })

      expect.assertions(4)
    })

    test('unknown binding', () => {
      ([
        'x ? 1 : 2',
        'true ? x : 2',
        'false ? 1 : x'
      ]).forEach((code) => {
        traverse(parseModule(code), {
          ConditionalExpression(path) {
            expect(u.evaluate(path)).toBeUndefined()
          }
        })
      })

      expect.assertions(3)
    })
  })
})

describe('evaluateTruthy', () => {
  test('returns true', () => {
    const ast = parseModule('1 + 1')

    traverse(ast, {
      BinaryExpression(path) {
        expect(u.evaluateTruthy(path)).toBe(true)
      }
    })

    expect.assertions(1)
  })

  test('returns false', () => {
    const ast = parseModule('1 - 1')

    traverse(ast, {
      BinaryExpression(path) {
        expect(u.evaluateTruthy(path)).toBe(false)
      }
    })

    expect.assertions(1)
  })

  test('returns undefined', () => {
    const ast = parseModule('1 + unknown')

    traverse(ast, {
      BinaryExpression(path) {
        expect(u.evaluateTruthy(path)).toBeUndefined()
      }
    })

    expect.assertions(1)
  })
})
