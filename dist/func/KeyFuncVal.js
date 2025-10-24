"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyFuncVal = void 0;
const val_1 = require("../val");
const FuncBaseVal_1 = require("./FuncBaseVal");
class KeyFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isKeyFunc = true;
        // this.dc = DONE
    }
    make(_ctx, spec) {
        return new KeyFuncVal(spec);
    }
    funcname() {
        return 'key';
    }
    /*
    unify(peer: Val, ctx: Context): Val {
      let out: Val = this
  
      if (
        this.id === peer.id
        || peer.isTop) {
        // self
      }
  
      else if (peer.isNil) {
        out = peer
      }
  
      else if (
        (peer as any).isScalarKind
        && peer.peg === String
      ) {
        return this
      }
  
      else {
        out = Nil.make(ctx, 'key-func', this, peer)
  
        out.row = this.row
        out.col = this.col
        out.url = this.url
        out.path = this.path
      }
  
      return out
    }
    */
    resolve(ctx, args) {
        let out = this;
        if (!this.mark.type && !this.mark.hide) {
            let move = this.peg?.[0]?.peg;
            move = isNaN(move) ? 1 : +move;
            const key = this.path[this.path.length - (1 + move)] ?? '';
            // console.log('KEYPATH', this.path, move, 'k=', key)
            // return key
            out = new val_1.StringVal({ peg: key });
        }
        // console.log('KEYFUNC', this.path, this.canon, out.canon)
        return out;
    }
    gen(ctx) {
        return undefined;
        /*
        if (null == ctx) {
          return undefined
        }
    
        let move = this.peg?.[0]?.peg
        move = isNaN(move) ? 1 : +move
        const key = this.path[this.path.length - (1 + move)] ?? ''
    
        // console.log('KEYPATH', this.path, move, 'k=', key)
        return key
        */
    }
}
exports.KeyFuncVal = KeyFuncVal;
//# sourceMappingURL=KeyFuncVal.js.map