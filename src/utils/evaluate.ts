import { NodePath, NodePathT } from '../nodepath'
import { assertNever, NodeT } from '../estree'

const evaluateBinaryExpr = (left: any, right: any, operator: NodeT<'BinaryExpression'>['operator']) => {
  switch (operator) {
    case '==':  return left == right // eslint-disable-line eqeqeq
    case '!=':  return left != right // eslint-disable-line eqeqeq
    case '===': return left === right
    case '!==': return left !== right
    case '<':   return left < right
    case '<=':  return left <= right
    case '>':   return left > right
    case '>=':  return left >= right
    case '<<':  return left << right
    case '>>':  return left >> right
    case '>>>': return left >>> right
    case '+':   return left + right
    case '-':   return left - right
    case '*':   return left * right
    case '/':   return left / right
    case '%':   return left % right
    case '**':  return left ** right
    case '|':   return left | right
    case '^':   return left ^ right
    case '&':   return left & right
    case 'in':  return left in right

    case 'instanceof': return
    /* istanbul ignore next */
    default: assertNever(operator)
  }
}

type EvaluationResult = { value: unknown }

class Evaluator {
  private cache = new Map<NodePath, EvaluationResult | undefined>()

  getEvaluated(path: NodePath): EvaluationResult | undefined {
    /* istanbul ignore if */
    if (this.cache.has(path)) {
      const cachedResult = this.cache.get(path)
      return cachedResult!
    } else {
      const result = this.evaluate(path)
      this.cache.set(path, result)
      return result
    }
  }

  evaluate(path: NodePath): EvaluationResult | undefined {
    switch (/* istanbul ignore next */ path.node?.type) {
      case 'Identifier':
        if (path.node.name === 'undefined') return { value: undefined }
        break

      case 'Literal':
        return { value: path.node.value }

      case 'BinaryExpression': {
        const aPath = path as NodePathT<'BinaryExpression'>
        const left = this.getEvaluated(aPath.get('left'))
        if (left == null) return
        const right = this.getEvaluated(aPath.get('right'))
        if (right == null) return

        const value = evaluateBinaryExpr(left.value, right.value, aPath.node!.operator)
        if (value == null) return

        return { value }
      }

      case 'UnaryExpression': {
        const aPath = path as NodePathT<'UnaryExpression'>
        const arg = this.getEvaluated(aPath.get('argument'))
        if (arg == null) return

        const argVal = arg.value as any

        switch (aPath.node!.operator) {
          case '+':
            return { value: +argVal }
          case '-':
            return { value: -argVal }
          case '!':
            return { value: !argVal }
          case '~':
            return { value: ~argVal }
          case 'typeof':
            return { value: typeof argVal }
          case 'void':
            return { value: undefined }
          case 'delete': break
          /* istanbul ignore next */
          default: assertNever(aPath.node!.operator)
        }

        break
      }

      case 'LogicalExpression': {
        const aPath = path as NodePathT<'LogicalExpression'>
        const left = this.getEvaluated(aPath.get('left'))
        const right = this.getEvaluated(aPath.get('right'))

        switch (aPath.node!.operator) {
          case '&&': {
            // If any of them is falsy, the expression will return `false`
            if (
              left != null && !left.value ||
              right != null && !right.value
            ) {
              return { value: false }
            }
            // If both of them are truthy, the expression will return `true`
            if (
              left != null && left.value &&
              right != null && right.value
            ) {
              return { value: true }
            }
            break
          }
          case '||': {
            // If any of them is truthy, the expression will always return `true`
            if (
              left != null && left.value ||
              right != null && right.value
            ) {
              return { value: true }
            }
            // If both of them are falsy, the expression will always return `false`
            if (
              left != null && !left.value &&
              right != null && !right.value
            ) {
              return { value: false }
            }
            break
          }
          case '??': {
            // Return left if it's not nullish
            // Return right if left is nullish
            if (left != null) {
              if (left.value != null) {
                return left
              } else if (right != null) {
                return right
              }
            }
            break
          }
          /* istanbul ignore next */
          default: assertNever(aPath.node!.operator)
        }

        break
      }

      case 'ObjectExpression': {
        const aPath = path as NodePathT<'ObjectExpression'>
        const object: Record<string, any> = {}
        const properties = aPath.get('properties')

        for (let i = 0; i < properties.length; i++) {
          const property = properties[i]

          if (property.type === 'Property') {
            /* istanbul ignore if: never going to happen, but just in case */
            if (property.node == null) return
            if (property.node.kind !== 'init') return

            const key = property.node.computed
              ? this.getEvaluated(property.get('key'))?.value as string
              : (property.node.key as NodeT<'Identifier'>).name
            
            if (key != null) {
              const value = this.getEvaluated(property.get('value'))
              if (value == null) return
              object[key] = value.value
            } else {
              return
            }
          } else /* istanbul ignore else */ if (property.type === 'SpreadElement') {
            const argument = this.getEvaluated(property.get('argument'))
            if (argument == null) return
            Object.assign(object, argument.value)
          } else {
            return
          }
        }

        return { value: object }
      }

      case 'ArrayExpression': {
        const aPath = path as NodePathT<'ArrayExpression'>
        const array = []
        const elements = aPath.get('elements')

        for (let i = 0; i < elements.length; i++) {
          const value = this.getEvaluated(elements[i])
          if (value == null) return
          array.push(value.value)
        }

        return { value: array }
      }

      case 'ConditionalExpression': {
        const aPath = path as NodePathT<'ConditionalExpression'>
        const test = this.getEvaluated(aPath.get('test'))
        if (test == null) return

        return this.getEvaluated(aPath.get(test.value ? 'consequent' : 'alternate'))
      }
    }
  }
}

/**
 * Evaluates the given `path`.
 * @returns An object with property `value` if evaluation is successful, otherwise `undefined`
 */
export const evaluate = (path: NodePath): { value: unknown } | undefined => {
  const result = new Evaluator().evaluate(path)
  if (result != null) return { value: result.value }
}

/**
 * Evaluates the given path for truthiness
 * @returns `true` or `false` if the evaluation is successful, otherwise `undefined`
 */
export const evaluateTruthy = (path: NodePath): boolean | undefined => {
  const result = evaluate(path)
  if (result != null) return !!result.value
}
