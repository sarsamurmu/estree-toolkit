import { parseModule } from 'meriyah';

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

import { traverse } from '<project>';

const cacheDir = path.join(__dirname, './__script_cache__');
const scriptLinks = {
  angular: 'angular@1.8.2/angular.js',
  'react-dom': 'react-dom@17.0.1/cjs/react-dom.development.js',
  three: 'three@0.124.0/build/three.js',
  vue: 'vue@3.0.5/dist/vue.esm-browser.js'
}

if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

const loadAST = async (scriptName: keyof typeof scriptLinks) => {
  const scriptPath = path.join(cacheDir, scriptName);
  if (!fs.existsSync(scriptPath)) {
    await new Promise<void>((done) => {
      const outFile = fs.createWriteStream(scriptPath);
      https.get(`https://cdn.jsdelivr.net/npm/${scriptLinks[scriptName]}`, (response) => {
        response.pipe(outFile);
        outFile.on('finish', () => {
          outFile.close();
          done();
        });
      });
    });
  }
  return parseModule(fs.readFileSync(scriptPath).toString());
}

test.each(Object.keys(scriptLinks))('%s', async (scriptName: any) => {
  traverse(await loadAST(scriptName), {
    $: { scope: true },
    Program() {/* Nothing */}
  });
});
