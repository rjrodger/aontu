/* Copyright (c) 2025 Richard Rodger, MIT License */


function cmpCodePoint(a: string, b: string): number {
  const ai = a[Symbol.iterator]()
  const bi = b[Symbol.iterator]()

  for (; ;) {
    const x = ai.next()
    const y = bi.next()

    if (x.done) {
      return y.done ? 0 : -1
    }
    if (y.done) {
      return 1
    }

    const xc = (x.value as string).codePointAt(0) as number
    const yc = (y.value as string).codePointAt(0) as number

    if (xc !== yc) {
      return xc < yc ? -1 : 1
    }
  }
} /* node:coverage ignore next 6 */


export {
  cmpCodePoint,
}
