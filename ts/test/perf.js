
const {  AontuX } = require('..')
const { performance } = require('perf_hooks')

const timing = {
  parse: new Array(1000),
  unify: new Array(1000),
  gen: new Array(1000),
  full: new Array(1000),
}
const exprs = new Array(1000)
let gI = 0

const A = new AontuX()

global.aontu_warm = true
global.aontu = {time:{
  langctor:[],
  langparse:[],
}}

for(let j = 0; j < 100; j++) {
  A.generate('a')
}

global.aontu_warm = false


const G = (s) => {
  exprs[gI] = s

  let start, pval, uval

  start = performance.now()
  pval = A.parse(s)
  timing.parse[gI] = performance.now()-start

  start = performance.now()
  uval = A.unify(pval)
  timing.unify[gI] = performance.now()-start

  start = performance.now()
  uval.gen()
  timing.gen[gI] = performance.now()-start

  start = performance.now()
  A.generate(s)
  timing.full[gI] = performance.now()-start

  gI++
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



/*
G(`
q0:a
q1:a&a
q2:a|a
q3:(a)
q4:(a&a)
q5:(a|a)
q6:(a)&a
q7:(a&a)&a
q8:(a|a)&a
q9:a&(a)
q10:a&(a&a)
q11:a&(a|a)
q12:a&(a)&a
q13:a&(a&a)&a
q14:a&(a|a)&a
q15:a&a
q16:a&a&a
q17:a|a&a
q18:a&a|a
q19:a&a&a&a
q20:a&a|a&a
q21:(a)|a
q22:(a&a)|a
q23:(a|a)|a
q24:a|(a)
q25:a|(a&a)
q26:a|(a|a)
q27:a|(a)|a
q28:a|(a&a)|a
q29:a|(a|a)|a
q30:a|a
q31:a&a|a
q32:a|a|a
q33:a|a&a
q34:a|a|a|a
q35:a|a&a|a
q36:x:a
q37:x:a&a
q38:x:a|a
q39:x:(a)
q40:x:(a&a)
q41:x:(a|a)
q42:x:(a)&a
q43:x:(a&a)&a
q44:x:(a|a)&a
q45:x:a&(a)
q46:x:a&(a&a)
q47:x:a&(a|a)
q48:x:a&(a)&a
q49:x:a&(a&a)&a
q50:x:a&(a|a)&a
q51:x:a&a
q52:x:a&a&a
q53:x:a|a&a
q54:x:a&a|a
q55:x:a&a&a&a
q56:x:a&a|a&a
q57:x:(a)|a
q58:x:(a&a)|a
q59:x:(a|a)|a
q60:x:a|(a)
q61:x:a|(a&a)
q62:x:a|(a|a)
q63:x:a|(a)|a
q64:x:a|(a&a)|a
q65:x:a|(a|a)|a
q66:x:a|a
q67:x:a&a|a
q68:x:a|a|a
q69:x:a|a&a
q70:x:a|a|a|a
q71:x:a|a&a|a
q72:[a]
q73:[a&a]
q74:[a|a]
q75:[(a)]
q76:[(a&a)]
q77:[(a|a)]
q78:[(a)&a]
q79:[(a&a)&a]
q80:[(a|a)&a]
q81:[a&(a)]
q82:[a&(a&a)]
q83:[a&(a|a)]
q84:[a&(a)&a]
q85:[a&(a&a)&a]
q86:[a&(a|a)&a]
q87:[a&a]
q88:[a&a&a]
q89:[a|a&a]
q90:[a&a|a]
q91:[a&a&a&a]
q92:[a&a|a&a]
q93:[(a)|a]
q94:[(a&a)|a]
q95:[(a|a)|a]
q96:[a|(a)]
q97:[a|(a&a)]
q98:[a|(a|a)]
q99:[a|(a)|a]
q100:[a|(a&a)|a]
q101:[a|(a|a)|a]
q102:[a|a]
q103:[a&a|a]
q104:[a|a|a]
q105:[a|a&a]
q106:[a|a|a|a]
q107:[a|a&a|a]
`)
*/

function stats(kind,range) {
  const total = timing[kind].reduce((s,n)=>s+n,0)
  const high = (lower,upper) => timing[kind].map(n=>n>=lower&n<upper?n:0)

  let max = 0, min = Number.MAX_SAFE_INTEGER
  for(let j = 0; j < timing[kind].length; j++) {
    let v = timing[kind][j]
    min = Math.min(min,v)
    max = Math.max(max,v)
  }

  console.log(kind+' total=', total, 'avg=', total/gI, 'min=', min, 'max=', max)
  
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

timing.langctor = global.aontu.time.langctor
timing.langparse = global.aontu.time.langparse

stats('langctor',[5,10,15])
stats('langparse',[5,10,15])


console.dir(global.aontu.time,{depth:null})
