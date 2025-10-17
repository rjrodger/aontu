
const {  AontuX } = require('..')
const { performance } = require('perf_hooks')

const timing = {
  parse: new Array(1000),
  unify: new Array(1000),
  gen: new Array(1000),
  full: new Array(1000),
}
const exprs = new Array(1000)
let i = 0

const A = new AontuX()

for(let j = 0; j < 100; j++) {
  A.generate('a')
}


const G = (s) => {
  exprs[i] = s

  let start, pval, uval

  start = performance.now()
  pval = A.parse(s)
  timing.parse[i] = performance.now()-start

  start = performance.now()
  uval = A.unify(pval)
  timing.unify[i] = performance.now()-start

  start = performance.now()
  uval.gen()
  timing.gen[i] = performance.now()-start

  start = performance.now()
  A.generate(s)
  timing.full[i] = performance.now()-start

  i++
}



G('a')
G('a&a')
G('a|a')

G('(a)')

G('(a&a)')

G('(a|a)')


G('(a)&a')
G('(a&a)&a')

G('(a|a)&a')

G('a&(a)')
G('a&(a&a)')
G('a&(a|a)')

G('a&(a)&a')
G('a&(a&a)&a')
G('a&(a|a)&a')

G('a&a')
G('a&a&a')
G('a|a&a')

G('a&a|a')

G('a&a&a&a')
G('a&a|a&a')

G('(a)|a')
G('(a&a)|a')
G('(a|a)|a')

G('a|(a)')
G('a|(a&a)')
G('a|(a|a)')

G('a|(a)|a')
G('a|(a&a)|a')
G('a|(a|a)|a')

G('a|a')
G('a&a|a')
G('a|a|a')

G('a|a&a')

G('a|a|a|a')
G('a|a&a|a')


G('x:a')
G('x:a&a')
G('x:a|a')

G('x:(a)')
G('x:(a&a)')
G('x:(a|a)')

G('x:(a)&a')
G('x:(a&a)&a')
G('x:(a|a)&a')

G('x:a&(a)')
G('x:a&(a&a)')
G('x:a&(a|a)')

G('x:a&(a)&a')
G('x:a&(a&a)&a')
G('x:a&(a|a)&a')

G('x:a&a')
G('x:a&a&a')
G('x:a|a&a')

G('x:a&a|a')

G('x:a&a&a&a')
G('x:a&a|a&a')

G('x:(a)|a')
G('x:(a&a)|a')
G('x:(a|a)|a')

G('x:a|(a)')
G('x:a|(a&a)')
G('x:a|(a|a)')

G('x:a|(a)|a')
G('x:a|(a&a)|a')
G('x:a|(a|a)|a')

G('x:a|a')
G('x:a&a|a')
G('x:a|a|a')

G('x:a|a&a')

G('x:a|a|a|a')
G('x:a|a&a|a')


G('[a]')
G('[a&a]')
G('[a|a]')

G('[(a)]')
G('[(a&a)]')
G('[(a|a)]')

G('[(a)&a]')
G('[(a&a)&a]')
G('[(a|a)&a]')

G('[a&(a)]')
G('[a&(a&a)]')
G('[a&(a|a)]')

G('[a&(a)&a]')
G('[a&(a&a)&a]')
G('[a&(a|a)&a]')

G('[a&a]')
G('[a&a&a]')
G('[a|a&a]')

G('[a&a|a]')

G('[a&a&a&a]')
G('[a&a|a&a]')

G('[(a)|a]')
G('[(a&a)|a]')
G('[(a|a)|a]')

G('[a|(a)]')
G('[a|(a&a)]')
G('[a|(a|a)]')

G('[a|(a)|a]')
G('[a|(a&a)|a]')
G('[a|(a|a)|a]')

G('[a|a]')
G('[a&a|a]')
G('[a|a|a]')

G('[a|a&a]')

G('[a|a|a|a]')
G('[a|a&a|a]')



function stats(kind,range) {
  const total = timing[kind].reduce((s,n)=>s+n,0)
  const high = (lower,upper) => timing[kind].map(n=>n>=lower&n<upper?n:0)
  console.log(kind+' total', total)
  console.log(kind+' avg', total/i)

  for(let r = 0; r < range.length; r++) {
    let lower = range[r]
    let upper = range[r+1] ?? 9999
    console.log(kind+' high-'+lower,
                high(lower,upper).map((n,i)=>0==n?'':(exprs[i]+' = '+n)).filter(n=>''!=n))
  }
}

stats('parse',[5,10,15])
stats('unify',[5,10,15])
stats('gen',[5,10,15])
stats('full',[10,15,20])

