import fs from 'fs';
import path from 'path';

import { definitions } from '../src/definitions';
import { aliases } from '../src/aliases';
import { toCamelCase } from '../src/helpers'

let content = '';
const nodeTypes = Object.keys(definitions);
const aliasNames = Object.keys(aliases);

content += `
// Generated file. Do not modify by hands.
// Run "npm run generate" to re-generate this file.

import { Node, BaseNode } from '../helpers';
import { ${nodeTypes.join(', ')} } from 'estree-jsx';
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
  content += `  ${toCamelCase(nodeName)}: Checker<${nodeName}>;\n`;
});

content += '\n';

aliasNames.forEach((aliasName) => {
  content += `  ${toCamelCase(aliasName)}: Checker<AliasMap['${aliasName}']>;\n`;
});

content += '}';

fs.writeFileSync(path.join(__dirname, '../src/generated/is-type.ts'), content);
