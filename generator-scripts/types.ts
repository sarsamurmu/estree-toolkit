import fs from 'fs';
import path from 'path';

import { definitions, aliases } from '../src/definitions';

const nodeTypes = Object.keys(definitions);
let content = `
// Generated file. Do not modify by hands.
// Run "npm run generate" to re-generate this file.

export {
  Node,
  SimpleLiteral,
  RegExpLiteral
} from 'estree';
export { ${nodeTypes.join(', ')} } from 'estree';
`.trim();

content += `import type { AliasMap } from '../definitions';\n\n`;

Object.keys(aliases).forEach((alias) => {
  content += `export type ${alias} = import('../definitions').AliasMap['${alias}'];\n`;
});

fs.writeFileSync(path.join(__dirname, '../src/generated/types.ts'), content);
