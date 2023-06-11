const fs = require('fs')
const path = require('path')

;(function fixStuffs(dirPath) {
  fs.readdirSync(dirPath).forEach((file) => {
    const p = path.join(dirPath, file)
    if (fs.lstatSync(p).isDirectory()) {
      fixStuffs(p)
    } else if (p.endsWith('.js')) {
      const content = fs.readFileSync(p, 'utf-8')
      fs.writeFileSync(
        p.replace(/\.js$/, '.mjs'),
        content.replace(
          /^(import|export)(\s+.*\s+)from\s*['"](.*)['"]/gm,
          (s, a, b, c) => {
            return a + b + `from '${c}.mjs'`
          })
      )
      fs.unlinkSync(p)

      fs.writeFileSync(
        p.replace(/\.js$/, '.d.ts'),
        `export * from '${path.relative(path.dirname(p), p.replace(/\bdist-es\b/, 'dist')).replace(/\\/g, '/')}'`
      )
    }
  })
})(path.resolve('./dist-es'))

