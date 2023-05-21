const Util = require('util')

let { Aontu, Lang, Context, util } = require('..')


let {
  Integer,
  NumberVal,
  StringVal,
  BooleanVal,
  IntegerVal,
  ScalarTypeVal,
} = require('../dist/lib/val')



let A = (s) => Aontu(s)
let D = (x) => console.dir(x, { depth: null })
let G = (v) =>
  console.log(
    v.canon,
    '::',
    Util.inspect(v.gen(), { depth: null }),
    Util.inspect(v.err, { depth: null })
  )

let V = (v) => console.dir(v, { depth: null })

let lang = new Lang()
let P = lang.parse.bind(lang)

let tmp = {}

let s = ''

// console.log(Aontu('11'))
// console.log(Aontu('11&number'))
// console.log(Aontu('11|22'))

// console.log(P('11'))
// console.log(P('11&number'))

// console.log(P('11|22'))

// console.log(P('.a.b'))

// console.log(Aontu('a:b:1,c:.a.b').gen())

// D(P('{a:1}&{a:number}'))
// D(A('{a:1}&{a:number}').gen())

// D(P('x:{a:number},y:{a:1}&.x',{log:-1}))
// D(A('x:{a:number},y:{a:1}&.x'))
// D(A('x:{a:number},y:{a:1}&.x').gen())

// D(P('x:{a:number},y:.x&{a:1}').canon)
// D(A('x:{a:number},y:.x&{a:1}'))
// D(A('x:{a:number},y:.x&{a:1}').canon)
// D(A('x:{a:number},y:.x&{a:1}').gen())

// D(A('{x:1}&{x:number}'))
// D(A('{x:number}&{x:1}').canon)

// D(A('1&number'))

// D(P('x:{a:number},y:{a:1}&.x'))
// D(P('x:{a:number},y:.x&{a:1}'))

// D(A('x:{a:number},y:{a:1}&.x'))
// D(A('x:{a:number},y:.x&{a:1}'))

// D(A('x:{a:number},y:{a:1}&.x').gen())
// D(A('x:{a:number},y:.x&{a:1}').gen())

// D(P('x:{a:number},y:{a:1,b:2}&.x'))
// D(P('x:{a:number},y:.x&{a:1,b:2}'))

// D(A('x:{a:number},y:{a:1,b:2}&.x'))
// D(A('x:{a:number},y:.x&{a:1,b:2}'))

// D(A('x:{a:number},y:{a:1,b:2}&.x').gen())
// D(A('x:{a:number},y:.x&{a:1,b:2}').gen())

// D(A('x:{a:number,c:3},y:{a:1,b:2}&.x').gen())
// D(A('x:{a:number,c:3},y:.x&{a:1,b:2}').gen())

// D(A('z:x:{a:number,c:3},y:{a:1,b:2}&.z.x').gen())
// D(A('z:x:{a:number,c:3},y:.z.x&{a:1,b:2}').gen())

// D(P('z:x:{a:number,c:3},y:{a:1,b:2}&.z.x',{log:-1}))

// D(P('{&:{b:number},a:{b:1}}',{xlog:-1}))
// D(A('{&:{b:number,c:2},a:{b:1},aa:{b:9}}',{xlog:-1}).gen())

// D(A('x:{&:{b:number,c:2}},x:a:{b:1},x:aa:{b:9}',{xlog:-1}).gen())

// G(A('1 & 1'))
// G(A('number|1'))
// G(A('number|string'))
// G(A('number|*1'))
// G(A('string|*1'))
// G(A('a:*1,a:2'))

// G(A(`
// a: *true | boolean
// b: .a
// c: .a & false
// d: { x: .a }
// d: { x: false }
// e: { x: .a }
// f: { &: *true | boolean }
// f: { y: false }
// g: .f
// h: { &: .a }
// h: { z: false }
// `))

// G(A(`
// x: y: { m: n: o: *false | boolean }
// a: b: { &: .x.y }
// # a: b: { c: {} }
// a: b: d: {}
// a: b: e: m: n: o: true
// `))

// G(tmp.a1 = A(`
// x: y: { m: n: o: *false | boolean }
// a: b: { &: .x.y }
// a: b: { c: {} }
// a: b: d: {}
// a: b: e: m: n: o: true
// `))

// G(tmp.a1)

// G(A('number|*1 & a'))
// G(A('number|*1 & 2'))
// G(A('number|*1 & number'))
// G(A('number|*1'))
// G(A('*1 & 2'))

// G(A('{a:number} & {a:1}'))
// G(A('[number] & [1]'))
// G(A('[{a:number},{b:[string,string]}] & [{a:11},{b:[x,y]}]'))

//G(A('{a:{b:1}, x:y:.a.b}'))
//G(A('a:b:1, x:y:.a.b'))
// G(A('{a:{b:1}}'))

// G(A('{a:{b:1}}'))

// G(A('x:{a: string, b: 1 & .x.a}'))

// G(A('x:{&:number,a:1}'))
// V(A('x:{&:number,a:1}'))

// G(A('[&:number,1]'))
// V(A('[&:number,1]'))

// G(A('[&:{x:number},{x:1}]'))
// V(A('[&:{x:number},{x:1}]'))

// let s = 'x:{a:.x.b}&{b:2}'
// let s = '{b:.a&.a}&{a:1} '


// s = `
// a: { x: 1 }
// b: { &: .a }
// #b: c0: { n:0}
// `
// for(let i = 0; i < 2222; i++) {
//   s+=`b: c${i}: { n:0 }
// `
// }


// s = `
// a: { x: 1, b: .q }
// a: { y: 2 }
// `


// s = `
// a: {x:1}
// b: { &: .a }
// b: c0: {n:0}
// b: c1: {n:1}
// b: c2: {n:2}
// `

// s = `
// 1&1&.a&2&2&.b&3&3
// #1&.a
// `


// s = `
// 1|number|top
// #1&top
// `


// s = `
// a: 1
// b: $.a // 1
// c: {
//   d: 2
//   e: .d
// }
// // c: {
// //   n: $KEY // "n"
// //   p: $PATH // "c.p"
// // }
// // cc: {
// //   nn: $.c.d$KEY // "d"
// // }
// // f: {
// //   g: { x: { y: 3 } }
// //   g: $SELF.x
// // }
// // h: i: j: k: {
// //   z: ...m // 4
// //   zz: ...j..ii // 5
// // }
// // h: i: m: 4
// // h: ii: 5
// `


s = `
# a: { n: .$KEY, x:1 }
# b: { &: .a }
b: { &: {n:.$KEY} }
# b: { c0: { k:0, m:.$KEY }}
b: { c1: { k:1 }}

`

let a = A(s)
console.log('========')
console.dir(a,{depth:null})
// console.log(a.canon)

// V(a)
G(a)



// let c0 = new Context({})
// // console.log(c0)

// let c1 = c0.descend('a')
// // console.log(c1)

// let n0 = new NumberVal(11,c1)
// console.log(n0)

// let c2 = c1.descend('b')
// let n1 = n0.clone(c2)
// console.log(n1)


// let m0 = A(`{c:d:e:f:1}`)
// // console.dir(m0,{depth:null})
// let m1 = m0.peg.c.peg.d
// console.dir(m1,{depth:null})

// let m1c = m1.clone(c2)
// console.dir(m1c,{depth:null})

