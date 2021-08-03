import fs from 'fs';
import path from 'path';

import { definitions } from '../src/definitions';
import { aliases } from '../src/aliases';

let content = '';
const nodeTypes = Object.keys(definitions);
const aliasNames = Object.keys(aliases);

const lowerCase = (str: string) => str[0].toLowerCase() + str.slice(1);

content += `
// Generated file. Do not modify by hands.
// Run "npm run generate" to re-generate this file.

import { Node, BaseNode, ${nodeTypes.join(', ')} } from 'estree';
import { NodePath } from '../nodepath';
import type { AliasMap } from '../aliases';

export type Matcher<T extends Node> = {
  [K in Exclude<keyof T, keyof BaseNode>]?: T[K] | ((value: T[K]) => boolean);
}

export type Checker<T extends Node> = {
  (node: Node | undefined | null, toMatch?: Matcher<T>): node is T;
  (path: NodePath | undefined | null, toMatch?: Matcher<T>): path is NodePath<T>;
}
`.trim();

content += '\n\nexport type Is = {\n';

nodeTypes.forEach((nodeName) => {
  content += `  ${lowerCase(nodeName)}: Checker<${nodeName}>;\n`;
});

content += '\n';

aliasNames.forEach((aliasName) => {
  content += `  ${lowerCase(aliasName)}: Checker<AliasMap['${aliasName}']>;\n`;
});

content += '}';

fs.writeFileSync(path.join(__dirname, '../src/generated/is-type.ts'), content);
