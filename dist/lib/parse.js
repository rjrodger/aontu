"use strict";
/* Copyright (c) 2020 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseVal = void 0;
const val_1 = require("./val");
//import Jsonic from 'jsonic'
//const Jsonic = require('jsonic')
// QUESTION: should unify clone or update both?
// does it matter if reference paths are maintained separately?
// TODO: replace with a real parse
function parseVal(p, s) {
    let path = p instanceof val_1.Path ? p : new val_1.Path(p);
    let val = new val_1.BottomVal(path);
    s = s.trim();
    if (s.startsWith('{')) {
        return new val_1.MapVal(s.replace(/[{}]/g, '')
            .split(/\s*,\s*/)
            .reduce((vm, pair) => {
            let [field, value] = pair.split(/\s*:\s*/);
            vm[field] = parseVal(path.append(field).str, value);
            return vm;
        }, {}), path);
    }
    let terms = s.split(/\s*&\s*/);
    if (1 < terms.length) {
        return new val_1.MeetVal(terms.map(term => parseVal(path, term)), path);
    }
    if ('$T' === s) {
        return new val_1.TopVal(path);
    }
    if ('$B' === s) {
        return new val_1.BottomVal(path);
    }
    if ('$int' === s) {
        return new val_1.IntTypeVal(path);
    }
    if (s.startsWith('$.')) {
        return new val_1.RefVal(new val_1.Path(s), path);
    }
    let n = parseInt(s);
    if (!isNaN(n)) {
        return new val_1.IntScalarVal(n, path);
    }
    /*
  if (s.startsWith('[')) {
  return parseListVal()
  }
  */
    return val;
}
exports.parseVal = parseVal;
//# sourceMappingURL=parse.js.map