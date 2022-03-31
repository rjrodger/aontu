
let { Aontu, Lang, util } = require('..')


let lang = new Lang()
let P = lang.parse.bind(lang)

console.log(Aontu('11'))
console.log(Aontu('11&number'))
console.log(Aontu('11|22'))

console.log(P('11'))
console.log(P('11&number'))

console.log(P('11|22'))


console.log(P('.a.b'))


console.log(Aontu('a:b:1,c:.a.b').gen())
