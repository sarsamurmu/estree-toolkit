import fs from 'fs';
import path from 'path';

import { definitions } from '../src/definitions';

let content = '';
const nodeNames = Object.keys(definitions);

content += `
// Generated file. Do not modify by hands.
// Run "npm run generate" to re-generate this file.

import { Node, BaseNode, ${nodeNames.join(', ')} } from 'estree';
import { NodePath } from '../nodepath';

export type Matcher<T extends Node> = {
  [K in Exclude<keyof T, keyof BaseNode>]?: T[K] | ((value: T[K]) => boolean);
}

export type Checker<T extends Node> = {
  (node: Node, toMatch?: Matcher<T>): node is T;
  (nodePath: NodePath, toMatch?: Matcher<T>): nodePath is NodePath<T>;
}
`.trim();

content += '\n\nexport type Is = {\n';

nodeNames.forEach((nodeName) => {
  const lowerCasedTypeName = nodeName[0].toLowerCase() + nodeName.slice(1);
  content += `  ${lowerCasedTypeName}: Checker<${nodeName}>;\n`;
});

content += '}';

fs.writeFileSync(path.join(__dirname, '../src/generated/is-type.ts'), content);
