import fs from 'fs';
import path from 'path';

import { definitions, aliases } from '../src/definitions';

const nodeTypes = Object.keys(definitions);
const aliasNames = Object.keys(aliases);
const typesToExport = [].concat(nodeTypes, aliasNames);
const content = `
// Generated file. Do not modify by hands.
// Run "npm run generate" to re-generate this file.

export {
  Node,
  SimpleLiteral,
  RegExpLiteral
} from 'estree';
export { ${typesToExport.join(', ')} } from 'estree';
`.trim();

fs.writeFileSync(path.join(__dirname, '../src/generated/types.ts'), content);
