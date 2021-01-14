import { NodePath } from '../nodepath';
import { assertNever, NodeT } from '../internal-utils';

const binaryExpressionEvaluators: {
  [K in NodeT<'BinaryExpression'>['operator']]: (left: any, right: any) => any;
} = {
  '==':   (left, right) => left == right, // eslint-disable-line eqeqeq
  '!=':   (left, right) => left != right, // eslint-disable-line eqeqeq
  '===':  (left, right) => left === right,
  '!==':  (left, right) => left !== right,
  '<':    (left, right) => left < right,
  '<=':   (left, right) => left <= right,
  '>':    (left, right) => left > right,
  '>=':   (left, right) => left >= right,
  '<<':   (left, right) => left << right,
  '>>':   (left, right) => left >> right,
  '>>>':  (left, right) => left >>> right,
  '+':    (left, right) => left + right,
  '-':    (left, right) => left - right,
  '*':    (left, right) => left * right,
  '/':    (left, right) => left / right,
  '%':    (left, right) => left % right,
  '**':   (left, right) => left ** right,
  '|':    (left, right) => left | right,
  '^':    (left, right) => left ^ right,
  '&':    (left, right) => left & right,

  in: (left, right) => left in right,
  instanceof: (left, right) => left instanceof right,
}

type EvaluationResult = { value: unknown };

class Evaluator {
  private cache = new Map<NodePath, EvaluationResult | undefined>();

  getEvaluated(path: NodePath): EvaluationResult | undefined {
    if (this.cache.has(path)) {
      const cachedResult = this.cache.get(path);
      return cachedResult!;
    } else {
      const result = this.evaluate(path);
      this.cache.set(path, result);
      return result;
    }
  }

  evaluate(path: NodePath): EvaluationResult | undefined {
    switch (path.node?.type) {
      case 'Identifier':
        if (path.node.name === 'undefined') return { value: undefined };
        break;

      case 'Literal':
        return { value: path.node.value };

      case 'BinaryExpression': {
        const aPath = path as NodePath<NodeT<'BinaryExpression'>>;
        const left = this.getEvaluated(aPath.get('left'));
        if (left == null) return;
        const right = this.getEvaluated(aPath.get('right'));
        if (right == null) return;

        return {
          value: binaryExpressionEvaluators[aPath.node!.operator](left.value, right.value)
        }
      }

      case 'UnaryExpression': {
        const aPath = path as NodePath<NodeT<'UnaryExpression'>>;
        const arg = this.getEvaluated(aPath.get('argument'));
        if (arg == null) return;

        const argVal = arg.value as any;

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
          case 'delete': break;
          /* istanbul ignore next */
          default: assertNever(aPath.node!.operator)
        }

        break;
      }

      case 'LogicalExpression': {
        const aPath = path as NodePath<NodeT<'LogicalExpression'>>;
        const left = this.getEvaluated(aPath.get('left'));
        const right = this.getEvaluated(aPath.get('right'));

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
            break;
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
            break;
          }
          case '??': {
            // Return left if it's not nullish
            // Return right if left is nullish
            if (left != null) {
              if (left.value != null) {
                return left;
              } else if (right != null) {
                return right;
              }
            }
            break;
          }
          default: assertNever(aPath.node!.operator)
        }
      }
    }
  }
}

/**
 * Evaluates the given `path`.
 * @returns An object with property `value` if evaluation is successful, otherwise `undefined`
 */
export const evaluate = (path: NodePath): { value: unknown } | undefined => {
  const result = new Evaluator().evaluate(path);
  if (result != null) return { value: result.value };
}

/**
 * Evaluates the given path for truthiness
 * @returns `true` or `false` if the evaluation is successful, otherwise `undefined`
 */
export const evaluateTruthy = (path: NodePath): boolean | undefined => {
  const result = evaluate(path);
  if (result) return !!result.value;
}
