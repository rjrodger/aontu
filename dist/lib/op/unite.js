"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.unite = void 0;
const type_1 = require("../type");
const ConjunctVal_1 = require("../val/ConjunctVal");
const DisjunctVal_1 = require("../val/DisjunctVal");
const Nil_1 = require("../val/Nil");
const PrefVal_1 = require("../val/PrefVal");
const RefVal_1 = require("../val/RefVal");
const val_1 = require("../val");
let uc = 0;
// Vals should only have to unify downwards (in .unify) over Vals they understand.
// and for complex Vals, TOP, which means self unify if not yet done
const unite = (ctx, a, b, whence) => {
    let out = a;
    let why = 'u';
    // console.log('AA OP unite  IN', a?.canon, b?.canon,
    //   'W', whence,
    //   'E', 0 < ctx?.err?.length ? ctx.err.map((e: Val) => e.canon) : '')
    let unified = false;
    if (b && (val_1.TOP === a || !a)) {
        //console.log('Utb', b.canon)
        out = b;
        why = 'b';
    }
    else if (a && (val_1.TOP === b || !b)) {
        //console.log('Uta', a.canon)
        out = a;
        why = 'a';
    }
    else if (a && b && val_1.TOP !== b) {
        if (a instanceof Nil_1.Nil) {
            out = update(a, b);
            why = 'an';
        }
        else if (b instanceof Nil_1.Nil) {
            out = update(b, a);
            why = 'bn';
        }
        else if (a instanceof ConjunctVal_1.ConjunctVal) {
            // console.log('Q', a.canon, b.canon)
            out = a.unify(b, ctx);
            unified = true;
            why = 'acj';
        }
        else if (b instanceof ConjunctVal_1.ConjunctVal ||
            b instanceof DisjunctVal_1.DisjunctVal ||
            b instanceof RefVal_1.RefVal ||
            b instanceof PrefVal_1.PrefVal) {
            // console.log('U', a.canon, b.canon)
            // return b.unify(a, ctx)
            out = b.unify(a, ctx);
            unified = true;
            // console.log('UO', out.canon)
            why = 'bv';
        }
        // Exactly equal scalars.
        else if (a.constructor === b.constructor && a.peg === b.peg) {
            out = update(a, b);
            why = 'up';
        }
        else {
            // console.log('QQQ')
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
    // console.log('AA OP unite OUT', a?.canon, b?.canon, '->', out && out.canon,
    //   0 < ctx?.err?.length ? ctx.err.map((e: Val) => e.canon) : '')
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
    return out;
};
exports.unite = unite;
function update(x, _y) {
    // TODO: update x with y.site
    return x;
}
//# sourceMappingURL=unite.js.map