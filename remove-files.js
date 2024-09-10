const fs = require('fs')
const path = require('path')

;[
  'dist',
  'dist-es'
].forEach((dir) => {
  dir = path.resolve(__dirname, dir)
  if (!fs.existsSync(dir)) return
  fs.rmSync(dir, { recursive: true })
})
