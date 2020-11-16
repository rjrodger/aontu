/* Copyright (c) 2020 Richard Rodger, MIT License */

import {
  Path,
  Val,
  BottomVal,
  TopVal,
  IntTypeVal,
  IntScalarVal,
  MeetVal,
  RefVal,
  MapVal,
} from './val'



//import Jsonic from 'jsonic'
//const Jsonic = require('jsonic')



// QUESTION: should unify clone or update both?
// does it matter if reference paths are maintained separately?


// TODO: replace with a real parse
function parseVal(p: string | Path, s: string): Val {
  let path = p instanceof Path ? p : new Path(p)
  let val: Val = new BottomVal(path)

  s = s.trim()


  if (s.startsWith('{')) {
    return new MapVal(
      s.replace(/[{}]/g, '')
        .split(/\s*,\s*/)
        .reduce((vm: any, pair: string) => {
          let [field, value] = pair.split(/\s*:\s*/)
          vm[field] = parseVal(path.append(field).str, value)
          return vm
        }, {}), path)
  }


  let terms = s.split(/\s*&\s*/)
  if (1 < terms.length) {
    return new MeetVal(terms.map(term => parseVal(path, term)), path)
  }


  if ('$T' === s) {
    return new TopVal(path)
  }

  if ('$B' === s) {
    return new BottomVal(path)
  }


  if ('$int' === s) {
    return new IntTypeVal(path)
  }

  if (s.startsWith('$.')) {
    return new RefVal(new Path(s), path)
  }




  let n = parseInt(s)
  if (!isNaN(n)) {
    return new IntScalarVal(n, path)
  }





  /*
if (s.startsWith('[')) {
return parseListVal()
}
*/

  return val
}

/*
function parseTokens(tokens: string[]): Val {
  let out: Val = new BottomVal()

  for (let tI = 0; tI < tokens.length; tI++) {

  }

  return out
}
*/

export {
  parseVal,
  //parseTokens,
}
