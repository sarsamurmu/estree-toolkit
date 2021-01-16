export const chain = (...validators: ((value: any) => void)[]) => (
  validators.reduce((prevFn, fn) => (value: any) => {
    prevFn(value);
    fn(value);
  })
)

export const meaningfulType = (value: any) => {
  if (value === null) {
    return 'null';
  } else if (Array.isArray(value)) {
    return 'array';
  } else {
    return typeof value;
  }
}

export const valueType = (
  ...types: ('string' | 'number' | 'bigint' | 'boolean' | 'undefined' | null)[]
) => {
  if (types.length === 1) {
    const type = types[0];
    return function validate(value: any) {
      if (typeof value !== type) {
        throw new Error(`Expected value to be \`${type}\` but got \`${meaningfulType(value)}\`. Value is ${value}.`);
      }
    }
  } else {
    return function validate(value: any) {
      for (let i = 0; i < types.length; i++) {
        const type = types[i];
        if (typeof value === type || value === type) {
          return;
        }
      }

      throw new Error(`Expected value to be one of \`${JSON.stringify(types)}\` but got \`${meaningfulType(value)}\`. Value is ${value}.`);
    }
  }
}

const reservedKeywords = new Set(`
break case catch class const continue debugger default
delete do else export extends finally for function if
import in instanceof new return super switch this throw
try typeof var void while with yield
`.trim().split(' ').map((s) => s.trim()));

export const isValidIdentifier = (name: string) => {
  if (
    /\s/.test(name) ||
    reservedKeywords.has(name) ||
    name.length === 0
  ) {
    throw new Error(`"${name}" is not a valid identifier.`);
  }
}
