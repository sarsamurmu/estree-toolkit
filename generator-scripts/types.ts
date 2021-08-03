import fs from 'fs';
import path from 'path';

import { definitions } from '../src/definitions';
import { aliases } from '../src/aliases';

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

content += `import type { AliasMap } from '../aliases';\n\n`;

Object.keys(aliases).forEach((alias) => {
  content += `export type ${alias} = AliasMap['${alias}'];\n`;
});

fs.writeFileSync(path.join(__dirname, '../src/generated/types.ts'), content);
