import { BaseNode } from 'estree';
import { aliases, AliasMap } from './aliases';
import { NodeMap, NodeT } from './internal-utils';

/**
 * A function, when called a value and it validates the value
 * @returns `null` if the value is valid or `string` of an error message
 * if the value is not valid
 */
export type ValidateFn<T> = (value: T) => string | null;

export const runValidation = (validateFn: ValidateFn<any>, value: any) => {
  const errorMsg = validateFn(value);
  if (errorMsg != null) {
    throw new Error(errorMsg);
  }
}

export const chain = <T>(...validateFns: ValidateFn<T>[]): ValidateFn<T> => (
  validateFns.reduce((prevFn, fn) => (val) => prevFn(val) || fn(val))
)

export const OR: {
  <T1, T2>(...fns: [ValidateFn<T1>, ValidateFn<T2>]): ValidateFn<T1 | T2>;
  <T1, T2, T3>(...fns: [ValidateFn<T1>, ValidateFn<T2>, ValidateFn<T3>]): ValidateFn<T1 | T2 | T3>;
} = (...validateFns: ValidateFn<any>[]): ValidateFn<any> => (value) => {
  const errorMsgs = [];
  for (let i = 0; i < validateFns.length; i++) {
    const errorMsg = validateFns[i](value);
    if (errorMsg != null) errorMsgs.push(errorMsg);
  }
  if (errorMsgs.length === validateFns.length) {
    return `The value is not compatible with the required type.\n\nMessages:\n${errorMsgs.join('\n')}`;
  }
  return null;
}

/* istanbul ignore next */
export const meaningfulType = (value: any) => {
  if (value === null) {
    return 'null';
  } else if (Array.isArray(value)) {
    return 'array';
  } else {
    return typeof value;
  }
}

type ValueTypeMap = {
  string: string;
  number: number;
  bigint: bigint;
  boolean: boolean;
  null: null;
}
type ValueType = keyof ValueTypeMap;

export const value = <T extends [ValueType, ...ValueType[]]>(
  ...types: T
): ValidateFn<ValueTypeMap[T[number]]> => {
  if (types.length === 1) {
    const type = types[0];
    return function validate(value) {
      if (typeof value !== type) {
        return `Expected the value to be a \`${type}\` but got a \`${meaningfulType(value)}\`. The value is ${JSON.stringify(value)}.`;
      }
      return null;
    }
  } else {
    return function validate(value) {
      for (let i = 0; i < types.length; i++) {
        const type = types[i];
        if (typeof value === type || (type === 'null' && value === null)) {
          return null;
        }
      }

      return `Expected the value to be one of \`${JSON.stringify(types)}\` but got a \`${meaningfulType(value)}\`. The value is ${JSON.stringify(value)}.`;
    }
  }
}

const reservedKeywords = new Set(`
break case catch class const continue debugger default
delete do else export extends finally for function if
import in instanceof new return super switch this throw
try typeof var void while with yield
`.trim().split(/[ \n]/).map((s) => s.trim()));

export const validIdentifier: ValidateFn<string> = (name) => {
  if (
    /[-\s]/.test(name) ||
    /^\d/.test(name) ||
    reservedKeywords.has(name) ||
    name.length === 0
  ) {
    return `"${name}" is not a valid identifier.`;
  }
  return null;
}

export const nonNull: ValidateFn<any> = (value) => {
  if (value == null) {
    return 'Expected the value to be non-null but got null or undefined value.';
  }
  return null;
}

export const node = <T extends keyof NodeMap>(type: T): ValidateFn<NodeT<T>> => (value) => {
  if (value == null || (value as BaseNode).type !== type) {
    return `Expected a "${type}" node but got a \`${meaningfulType(value)}\`. The value is ${JSON.stringify(value)}.`
  }
  return null;
}

export const nodeAlias = <T extends keyof AliasMap>(alias: T): ValidateFn<AliasMap[T]> => (value) => {
  if (value == null || !((value as BaseNode).type in aliases[alias])) {
    return `Expected one of (${Object.keys(aliases[alias]).join()}) node but got a \`${meaningfulType(value)}\`. The value is ${JSON.stringify(value)}.`
  }
  return null;
}

export const any: ValidateFn<any> = () => null;

export const arrayOf = <T>(validateFn: ValidateFn<T>): ValidateFn<T[]> => (value) => {
  if (Array.isArray(value)) {
    let errorMsg: string | null;
    for (let i = 0; i < value.length; i++) {
      errorMsg = validateFn(value[i]);
      if (errorMsg != null) return `Got unexpected value at index ${i}:\n  ${errorMsg}`;
    }
    return null;
  } else {
    return `Expected the value to be an array but got a \`${meaningfulType(value)}\`. The value is ${JSON.stringify(value)}.`
  }
}

export const oneOf = <T extends readonly unknown[]>(items: T): ValidateFn<T[number]> => (value) => {
  if (!items.includes(value)) {
    return `Expected the value to be one of ${JSON.stringify(items)}, but got ${JSON.stringify(value)}`
  }
  return null;
}

export const nullable = <T>(validateFn: ValidateFn<T>): ValidateFn<T | null> => (value) => {
  if (value === null) {
    return null;
  }
  return validateFn(value);
}
