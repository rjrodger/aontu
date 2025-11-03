
const Util = require('node:util')
const { AontuX, formatExplain } = require('..')

const args = {
  src: process.argv[2],
  debug: process.argv[3],
  trace: process.argv[4],
  explain: process.argv[5],
  vars: process.argv[6],
}

const vars = (args.vars ?? '').split(',')
      .reduce((a,kv,_)=>(_=kv.split('='),a[_[0]]=_[1],a),{})

const hasDebugArg = ('canon'===args.debug || 'lang' ===args.debug || 'deep'===args.debug)

const aontu = new AontuX({
  path: process.cwd(),
  debug: 'lang' === args.debug || 'trace' == args.trace,
  trace: 'trace' == args.trace,
})

let err = []
// err.foo = 1

let explain = null

if(hasDebugArg) {
  console.log('> SRC:', args.src)
}

if(hasDebugArg) {
  if('explain' === args.explain) {
    explain = []
  }

  const pval = aontu.parse(args.src, {err, explain})
  
  if(hasDebugArg) {
    console.log('> CANON:', pval?.canon)
  }

  if('deep'===args.debug) {
    console.log('> AST:'),
    print(pval)
  }
}

let root


if(hasDebugArg && 0 === err.length) {
  if('explain' === args.explain) {
    explain = []
  }

  root = aontu.unify(args.src, {err,collect:true,explain})
  console.log('> UNIFIED:', root.canon)

  if('deep'===args.debug) {
    print(root)
  }
}


if(0 === err.length) {
  if('explain' === args.explain) {
    explain = []
  }

  if(hasDebugArg) {
    console.log('> GEN:')
  }
  const meta = {err,explain,var:vars}
  const out = aontu.generate(args.src, meta)

  print(out)
}

if('explain' === args.explain) {
  console.log('> EXPLAIN:')
  console.log(formatExplain(explain))
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
        maxStringLength: 33,
        stringBreakNewline: true,
        depth: null,
      })
      .replace(/: /g, ':')
  )
}


    
