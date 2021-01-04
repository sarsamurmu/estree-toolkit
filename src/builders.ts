import { Builders } from './generated/builders-type';
import { definitions, Definition, Definitions, DefinitionField, getFieldsOf } from './definitions';

export const builders: Builders = {} as any;

// Pseudo type for some kind of value, actual value may not this type
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Some extends Record<string, Record<string, unknown>> {}

for (const key in definitions) {
  const nodeType = key as keyof Definitions;

  const lowerCasedNodeType = nodeType[0].toLowerCase() + nodeType.slice(1);
  const definition: Definition = (definitions as any)[nodeType];
  const { fields } = definition;
  const fieldNames = getFieldsOf(definition, 'builder');

  (builders as any)[lowerCasedNodeType] = (...args: any[]) => {
    const node: Record<string, unknown> = { type: nodeType };

    fieldNames.forEach((fieldName, index: number) => {
      let shouldValidate = true;
      const field = (fields as Record<string, DefinitionField<Some, Some>>)[fieldName];

      node[fieldName] = args[index] || (
        'default' in field
          ? (shouldValidate = true) && (
            typeof field.default == 'function'
              ? field.default(node as Some)
              : field.default
          )
          : args[index]
      );

      if (shouldValidate) field.validate?.(node[fieldName] as Some);
    });

    return node;
  }
}
