import fs from 'fs';
import path from 'path';

import { definitions } from '../src/definitions';

const types = Object.keys(definitions);
const content = `
import { ${types.join(', ')} } from 'estree';
export {
  Node,
  Function,
  Statement,
  Declaration,
  Expression,
  Pattern,
  SimpleLiteral,
  RegExpLiteral,
  Class
} from 'estree';
export { ${types.join(', ')} }
`.trim();

fs.writeFileSync(path.join(__dirname, '../src/generated/types.ts'), content);
