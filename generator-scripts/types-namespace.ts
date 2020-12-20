import fs from 'fs';
import path from 'path';

import { definitions } from '../src/definitions';

const reserved = ['arguments', 'static'];
const nodeNames = Object.keys(definitions);
let content =
`// Generated file. Do not modify by hands.
// Run "npm run generate" to re-generate this file.

import {
  ${nodeNames.join(',\n  ')}
} from 'estree';

export type TypesNamespace = {
`;

nodeNames.forEach((nodeName) => {
  const fields = definitions[nodeName];
  const lowerCasedTypeName = nodeName[0].toLowerCase() + nodeName.slice(1);
  const parameters = fields.map(({ key, optional, type }) => {
    return `${(reserved.includes(key) ? '_' : '') + key}${optional ? '?' : ''}: ${type || `${nodeName}['${key}']` }`
  }).join(', ');
  content += `  ${lowerCasedTypeName}(${parameters}): ${nodeName};\n`;
});

content += '}';

fs.writeFileSync(path.join(__dirname, '../src/generated/types-namespace.ts'), content);
