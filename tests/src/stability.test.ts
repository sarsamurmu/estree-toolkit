import { parseModule } from 'meriyah';

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

import { traverse } from '<project>';

const cacheDir = path.join(__dirname, './__script_cache__');
const scriptLinks = {
  angular: 'angular@1.8.2/angular.js',
  'angular-min': 'angular@1.8.2/angular.min.js',
  axios: 'axios@0.21.1/dist/axios.js',
  'axios-min': 'axios@0.21.1/dist/axios.min.js',
  bootstrap: 'bootstrap@4.5.3/dist/js/bootstrap.bundle.js',
  'bootstrap-min': 'bootstrap@4.5.3/dist/js/bootstrap.bundle.min.js',
  d3: 'd3@6.3.1/dist/d3.js',
  'd3-min': 'd3@6.3.1/dist/d3.min.js',
  lodash: 'lodash@4.17.20/lodash.js',
  'lodash-min': 'lodash@4.17.20/lodash.min.js',
  'react-dom': 'react-dom@17.0.1/cjs/react-dom.development.js',
  'react-dom-min': 'react-dom@17.0.1/cjs/react-dom.production.min.js',
  'semantic-ui': 'semantic-ui@2.4.2/dist/semantic.js',
  'semantic-ui-min': 'semantic-ui@2.4.2/dist/semantic.min.js',
  three: 'three@0.124.0/build/three.js',
  'three-min': 'three@0.124.0/build/three.min.js',
  'three-module': 'three@0.124.0/build/three.module.js',
  vue: 'vue@3.0.5/dist/vue.esm-browser.js'
}

if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

const loadAST = async (scriptName: keyof typeof scriptLinks) => {
  const scriptPath = path.join(cacheDir, scriptName);
  if (!fs.existsSync(scriptPath)) {
    // Welcome to callback hell ._.
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
