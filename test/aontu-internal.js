
const Util = require('node:util')
const { Aontu, Context, parse } = require('..')

const src = process.argv[2]
const debug = process.argv[3]

if(debug) {
  const pval = parse({src},{src,deps:{}})

  if('canon'===debug || 'deep'===debug) {
    console.log('> CANON:', pval.canon)
  }

  if('deep'===debug) {
    console.log('> AST:'),
    // console.dir(pval,{depth:null})
    print(pval)
  }
}

const root = Aontu(src, {
  path: process.cwd()
})

console.log('> UNIFIED:', root.canon)

if('deep'===debug) {
  print(root)
}


if(0<root.err?.length) {
  root.err.map(err=>console.error(err.msg))
}
else {
  if(debug) {
    console.log('> GEN:')
  }
  const err = []
  const out = root.gen(new Context({ src, root, err }))

  if(0<err.length) {
    console.log('> ERRORS: '+err.length)
    err.map(err=>console.error(err.msg))
  }
  else {
    print(out)
  }
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


    
