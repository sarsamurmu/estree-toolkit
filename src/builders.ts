import { Builders } from './generated/builders-type';
import { definitions, BaseFieldData } from './definitions';

export const builders: Builders = {} as any;

for (const nodeName in definitions) {
  const fields = definitions[nodeName as keyof typeof definitions];
  const lowerCasedNodeName = nodeName[0].toLowerCase() + nodeName.slice(1);

  (builders as any)[lowerCasedNodeName] = (...args: any[]) => {
    const node: Record<string, any> = { type: nodeName };

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
