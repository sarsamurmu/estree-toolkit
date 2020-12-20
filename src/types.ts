import { TypesNamespace } from './generated/types-namespace';
import { definitions } from './definitions';

export const typesNamespace: TypesNamespace = {} as any;

for (const key in definitions) {
  const definition = definitions[key];

  (typesNamespace as any)[key] = (...args: any[]) => {
    const node: Record<string, any> = { type: key };
    args.forEach((argValue, index) => {
      const fieldData = definition[index];
      const lowerCaseKey = fieldData.key[0].toLowerCase() + fieldData.key.slice(1);

      node[lowerCaseKey] = argValue || (
        fieldData.optional
          ? (
            typeof fieldData.default == 'function'
              ? fieldData.default(node)
              : fieldData.default
          )
          : argValue
      );

      fieldData.validate?.(argValue);
    });
    return node;
  }
}
