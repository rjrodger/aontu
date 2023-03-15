
let { Aontu, Context, TOP } = require('../..')

let rootval = Aontu(process.argv[2])

console.log('CANON')
console.log(rootval.canon)

if(0<rootval.err.length) {
  console.log('ERROR')
  console.log(rootval.err)
  console.log(rootval.err.map(e=>e.msg).join('\n\n'))
}


console.log('UNIFY')
const genctx = new Context({root:TOP,err:[]})
console.dir(rootval.gen(genctx),{depth:null})

if(0<genctx.err.length) {
  console.log('GEN ERROR')
  console.log(genctx.err.map(e=>e.msg))
}

// console.log('TREE')
// console.dir(rootval,{depth:null})
