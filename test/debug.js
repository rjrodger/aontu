const Util = require('util')

const { Lang } = require('../dist/lib/lang')
const { Context } = require('../dist/lib/unify')
const { MapVal, TOP, DONE } = require('../dist/lib/val')
const { unite } = require('../dist/lib/op/op')

let lang = new Lang()
let PL = lang.parse.bind(lang)
let P = (src, ctx) =>
  'string' === typeof src ? PL(src, ctx) : src.map((s) => PL(s, ctx))

let ctx = new Context({ root: new MapVal({}) })

let src = process.argv[2]
console.log('SRC   : ', src)

let parse = P(src, ctx)
console.log('PARSE : ', parse.canon)

let unitings = [parse]

ctx = new Context({ root: parse })

let uc = 1
for (; uc < 111 && DONE !== unitings[uc - 1].done; uc++) {
  unitings[uc] = unite(ctx.clone({ root: unitings[uc - 1] }), parse, TOP)
  console.log('UNITE : ', uc, unitings[uc].done, unitings[uc].canon)
}

console.log(
  'GEN   : ',
  Util.inspect(unitings[uc - 1].gen(ctx), {
    compact: false,
    depth: null,
    colors: true,
  })
)

if (0 < ctx.err.length) {
  console.log(
    'ERROR : ',
    ctx.err.map(
      (e) =>
        e.why +
        ':' +
        e.row +
        ':' +
        e.col +
        ':' +
        (e.primary && e.primary.canon) +
        ':' +
        (e.secondary && e.secondary.canon)
    )
  )
}
