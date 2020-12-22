import { Builders } from './generated/builders-type';
import { definitions, BaseFieldData } from './definitions';

export const builders: Builders = {} as any;

for (const nodeType in definitions) {
  const fields = definitions[nodeType as keyof typeof definitions];
  const lowerCasedNodeType = nodeType[0].toLowerCase() + nodeType.slice(1);

  (builders as any)[lowerCasedNodeType] = (...args: any[]) => {
    const node: Record<string, any> = { type: nodeType };

    fields.forEach((field: BaseFieldData, index: number) => {
      node[field.key] = args[index] || (
        field.optional
          ? (
            typeof field.default == 'function'
              ? field.default(node)
              : field.default
          )
          : args[index]
      );

      field.validate?.(args[index]);
    });

    return node;
  }
}
