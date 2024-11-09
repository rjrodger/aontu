const Fs = require('node:fs')
const { Aontu } = require('..')

let path = process.argv[2]
let src = path

if (Fs.existsSync(path)) {
  src = Fs.readFileSync(path, 'utf8')
} else {
  path = undefined
}

try {
  console.dir(Aontu({ src, path }).gen({ src }), { depth: null })
} catch (e) {
  console.log(e.aontu ? e.message : e)
}
