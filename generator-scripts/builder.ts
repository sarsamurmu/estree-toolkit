import fs from 'fs';
import path from 'path';

import { fieldDefinitions } from '../dist/types';

const reserved = ['arguments', 'static'];
const nodes = Object.keys(fieldDefinitions);
let content =
`// Generated file. Do not modify by hands.
// Run "npm run generate" to re-generate this file.

import {
  ${nodes.join(',\n  ')}
} from 'estree';

export type Builders = {
`;

nodes.forEach((node) => {
  const fields = fieldDefinitions[node];
  const lowerCasedTypeName = node[0].toLowerCase() + node.slice(1);
  const parameters = fields.map(({ key, optional, type }) => {
    return `${(reserved.includes(key) ? '_' : '') + key}${optional ? '?' : ''}: ${type || `${node}['${key}']` }`
  }).join(', ');
  content += `  ${lowerCasedTypeName}(${parameters}): ${node};\n`;
});

content += '}';

fs.writeFileSync(path.join(__dirname, '../src/generated/builder.ts'), content);
