"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.unite = void 0;
const type_1 = require("../type");
const Nil_1 = require("../val/Nil");
const val_1 = require("../val");
let uc = 0;
// Vals should only have to unify downwards (in .unify) over Vals they understand.
// and for complex Vals, TOP, which means self unify if not yet done
const unite = (ctx, a, b, whence) => {
    // const ac = a?.canon
    // const bc = b?.canon
    let out = a;
    let why = 'u';
    let unified = false;
    if (b && (val_1.TOP === a || !a)) {
        out = b;
        why = 'b';
    }
    else if (a && (val_1.TOP === b || !b)) {
        out = a;
        why = 'a';
    }
    else if (a && b && val_1.TOP !== b) {
        if (a.isNil) {
            out = update(a, b);
            why = 'an';
        }
        else if (b.isNil) {
            out = update(b, a);
            why = 'bn';
        }
        else if (a.isConjunctVal) {
            out = a.unify(b, ctx);
            unified = true;
            why = 'acj';
        }
        else if (b.isConjunctVal ||
            b.isDisjunctVal ||
            b.isRefVal ||
            b.isPrefVal) {
            out = b.unify(a, ctx);
            unified = true;
            why = 'bv';
        }
        // Exactly equal scalars.
        else if (a.constructor === b.constructor && a.peg === b.peg) {
            out = update(a, b);
            why = 'up';
        }
        else {
            out = a.unify(b, ctx);
            unified = true;
            why = 'ab';
        }
    }
    if (!out || !out.unify) {
        out = Nil_1.Nil.make(ctx, 'unite', a, b);
        why += 'N';
    }
    if (type_1.DONE !== out.done && !unified) {
        out = out.unify(val_1.TOP, ctx);
        why += 'T';
    }
    uc++;
    // TODO: KEEP THIS! print in debug mode! push to ctx.log?
    /*
    console.log(
      'U',
      ('' + ctx.cc).padStart(2),
      ('' + uc).padStart(4),
      (whence || '').substring(0, 16).padEnd(16),
      why.padEnd(6),
      ctx.path.join('.').padEnd(16),
      (a || '').constructor.name.substring(0, 3),
      '&',
      (b || '').constructor.name.substring(0, 3),
      '|',
      '  '.repeat(ctx.path.length),
      a?.canon, '&', b?.canon, '->', out.canon)
    */
    // console.log('UNITE', whence, a?.id + '=' + a?.canon, b?.id + '=' + b?.canon, '->',
    //  out?.canon, 'W=' + why, 'E=', out?.err)
    return out;
};
exports.unite = unite;
function update(x, _y) {
    // TODO: update x with y.site
    return x;
}
//# sourceMappingURL=unite.js.map