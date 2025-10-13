
const Util = require('node:util')
const { AontuX } = require('..')

const src = process.argv[2]
const debug = process.argv[3]


const aontu = new AontuX({
  path: process.cwd()
})

let err = []

if(debug) {
  console.log('> SRC:', src)
}

if(debug) {
  const pval = aontu.parse(src)
  err = pval.err
  
  if('canon'===debug || 'deep'===debug) {
    console.log('> CANON:', pval.canon)
  }

  if('deep'===debug) {
    console.log('> AST:'),
    print(pval)
  }
}

let root


if(debug && 0 === err.length) {
  root = aontu.unify(src)
  err = root.err
  
  console.log('> UNIFIED:', root.canon)

  if('deep'===debug) {
    print(root)
  }
}

if(0 === err.length) {
  if(debug) {
    console.log('> GEN:')
  }
  const out = aontu.generate(src, {err})
  print(out)
}


if(0 < err.length) {
  console.log('> ERRORS: '+err.length)
  err.map(err=>console.error(err.msg))
}



function print(v) {
  let d = 0
  console.log(
    Util.inspect(
      v, {
        compact: true,
        colors: true,
        // breakLength: Infinity,
        maxStringLength: 33,
        stringBreakNewline: true,
        depth: null,
      })
      .replace(/: /g, ':')
      // .replace(/ ([{}[\]],?) /g, ' $1\n')
      // .replace(/^.*$/gm,l=>{
      //   l=l.trim()
      //   if(!l)return""
      //   if(/ [}\]],?/.test(l))d--
      //   let r="  ".repeat(d<0?0:d)+l
      //   if(/[{\[]\s*$/.test(l))d++
      //   return r
      // })
  )
}


    
