import fs from 'fs';
import path from 'path';

import { definitions } from '../src/definitions';

let content = '';
const nodeNames = Object.keys(definitions);

const isReserved = (name: string) => {
  try {
    eval(`{let ${name}}`);
    return false;
  } catch (e) {
    return true;
  }
}

content += `// Generated file. Do not modify by hands.
// Run "npm run generate" to re-generate this file.

import { ${nodeNames.join(', ')} } from 'estree';

export type Builders = {
`

nodeNames.forEach((nodeName) => {
  const fields = definitions[nodeName];
  const lowerCasedTypeName = nodeName[0].toLowerCase() + nodeName.slice(1);
  const parameters = fields.map(({ key, optional, type }) => {
    return `${(isReserved(key) ? '_' : '') + key}${optional ? '?' : ''}: ${type || `${nodeName}['${key}']` }`
  }).join(', ');
  content += `  ${lowerCasedTypeName}(${parameters}): ${nodeName};\n`;
});

content += '}';

fs.writeFileSync(path.join(__dirname, '../src/generated/builders-type.ts'), content);
