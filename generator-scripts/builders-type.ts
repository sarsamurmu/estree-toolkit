import fs from 'fs';
import path from 'path';

import { Definition, DefinitionField, definitions, getFieldsOf } from '../src/definitions';

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

content += `
// Generated file. Do not modify by hands.
// Run "npm run generate" to re-generate this file.

import { ${nodeNames.join(', ')} } from 'estree-jsx';
`.trim();

content += '\n\nexport type Builders = {\n';

const defaultKey: keyof DefinitionField<any, any> = 'default';
nodeNames.forEach((nodeName) => {
  const definition: Definition = definitions[nodeName];
  const lowerCasedTypeName = (nodeName[0].toLowerCase() + nodeName.slice(1)).replace(/^jsx/i, 'jsx');
  const parameters = getFieldsOf(definition, 'builder').map((fieldName) => {
    const field: DefinitionField<any, any> = definition.fields[fieldName];
    const optional = defaultKey in field;

    return `${(isReserved(fieldName) ? '_' : '') + fieldName}${optional ? '?' : ''}: ${field.type || `${nodeName}['${fieldName}']` }`
  }).join(', ');

  content += `  ${lowerCasedTypeName}(${parameters}): ${nodeName};\n`;
});

content += '}';

fs.writeFileSync(path.join(__dirname, '../src/generated/builders-type.ts'), content);
