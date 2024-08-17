import { parseModule } from 'meriyah'

import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'

import { traverse } from '<project>'

jest.setTimeout(100000)

const cacheDir = path.join(__dirname, './__script_cache__')
const scriptLinks = [
  'angular@1.8.2/angular.js',
  'angular@1.8.2/angular.min.js',
  'axios@0.21.1/dist/axios.js',
  'axios@0.21.1/dist/axios.min.js',
  'bootstrap@4.5.3/dist/js/bootstrap.bundle.js',
  'bootstrap@4.5.3/dist/js/bootstrap.bundle.min.js',
  'lodash@4.17.20/lodash.js',
  'lodash@4.17.20/lodash.min.js',
  'semantic-ui@2.4.2/dist/semantic.js',
  'semantic-ui@2.4.2/dist/semantic.min.js',
  'vue@3.0.5/dist/vue.esm-browser.js',

  // Added 17 August 2024
  '@angular/core@18.2.0/fesm2022/core.mjs',
  '@angular/core@18.2.0/fesm2022/core.min.mjs',
  'd3@7.9.0/dist/d3.js',
  'd3@7.9.0/dist/d3.min.js',
  'react-dom@18.3.1/umd/react-dom.development.js',
  'react-dom@18.3.1/umd/react-dom.production.min.js',
  'underscore@1.13.7/underscore-umd.js',
  'underscore@1.13.7/underscore-esm.js',
  'animejs@3.2.2/lib/anime.js',
  'animejs@3.2.2/lib/anime.min.js',
  'three@0.167.1/build/three.module.js',
  'three@0.167.1/build/three.module.min.js',
  '@tensorflow/tfjs-core@4.20.0/dist/tf-core.js',
  '@tensorflow/tfjs-core@4.20.0/dist/tf-core.min.js',
]

if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir)

const loadAST = async (script: string) => {
  const match = script.match(/([\w@/-]+)@([\d.]+)(.*)/)
  const [, pkg, version, file] = match
  const fileName = `${pkg.replace(/\//g, '_') }_${version}_${file.split('/').at(-1)}`
  const scriptPath = path.join(cacheDir, fileName)
  if (!fs.existsSync(scriptPath)) {
    // Welcome to callback hell ._.
    await new Promise<void>((done) => {
      const outFile = fs.createWriteStream(scriptPath)
      https.get(`https://cdn.jsdelivr.net/npm/${script}`, (response) => {
        response.pipe(outFile)
        outFile.on('finish', () => {
          outFile.close()
          done()
        })
      })
    })
  }
  return parseModule(fs.readFileSync(scriptPath).toString())
}

test.each(scriptLinks)('%s', async (scriptLink: string) => {
  await loadAST(scriptLink)
  traverse(await loadAST(scriptLink), {
    $: { scope: true },
    Program() {/* Nothing */},
    Identifier() {}
  })
})
