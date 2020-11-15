"use strict";
/* Copyright (c) 2020 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTokens = exports.parseVal = void 0;
const val_1 = require("./val");
//import Jsonic from 'jsonic'
//const Jsonic = require('jsonic')
// QUESTION: should unify clone or update both?
// does it matter if reference paths are maintained separately?
function parseVal(s) {
    let val = new val_1.BottomVal();
    s = s.trim();
    if ('$T' === s) {
        return new val_1.TopVal();
    }
    if ('$B' === s) {
        return new val_1.BottomVal();
    }
    if ('$int' === s) {
        return new val_1.IntTypeVal();
    }
    if (s.startsWith('$.')) {
        return new val_1.RefVal(s);
    }
    let n = parseInt(s);
    if (!isNaN(n)) {
        return new val_1.IntScalarVal(n);
    }
    /*
  if (s.startsWith('{')) {
    return parseMapVal()
  }
  
  if (s.startsWith('[')) {
    return parseListVal()
  }
  
  
  if (s.startsWith('$')) {
    return new RefVal(new Path(s))
  }
  */
    return val;
}
exports.parseVal = parseVal;
function parseTokens(tokens) {
    let out = new val_1.BottomVal();
    for (let tI = 0; tI < tokens.length; tI++) {
    }
    return out;
}
exports.parseTokens = parseTokens;
//# sourceMappingURL=parse.js.map