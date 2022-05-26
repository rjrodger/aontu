"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.unite = void 0;
const val_1 = require("../val");
// Vals should only have to unify downwards (in .unify) over Vals they understand.
// and for complex Vals, TOP, which means self unify if not yet done
const unite = (ctx, a, b, whence) => {
    let out = a;
    // console.log('AA OP unite  IN', a?.canon, b?.canon,
    //   'W', whence,
    //   'E', 0 < ctx?.err?.length ? ctx.err.map((e: Val) => e.canon) : '')
    if (b && (val_1.TOP === a || !a)) {
        //console.log('Utb', b.canon)
        out = b;
    }
    else if (a && (val_1.TOP === b || !b)) {
        //console.log('Uta', a.canon)
        out = a;
    }
    else if (a && b && val_1.TOP !== b) {
        if (a instanceof val_1.Nil) {
            out = update(a, b);
        }
        else if (b instanceof val_1.Nil) {
            out = update(b, a);
        }
        else if (b instanceof val_1.ConjunctVal ||
            b instanceof val_1.DisjunctVal ||
            b instanceof val_1.RefVal ||
            b instanceof val_1.PrefVal) {
            //console.log('U', a.canon, b.canon)
            return b.unify(a, ctx);
        }
        // Exactly equal scalars.
        else if (a.constructor === b.constructor && a.peg === b.peg) {
            out = update(a, b);
        }
        else {
            out = a.unify(b, ctx);
        }
    }
    if (!out) {
        out = val_1.Nil.make(ctx, 'unite', a, b);
    }
    if (val_1.DONE !== out.done) {
        out = out.unify(val_1.TOP, ctx);
    }
    // console.log('AA OP unite OUT', a?.canon, b?.canon, '->', out && out.canon,
    //   0 < ctx?.err?.length ? ctx.err.map((e: Val) => e.canon) : '')
    return out;
};
exports.unite = unite;
function update(x, _y) {
    // TODO: update x with y.site
    return x;
}
//# sourceMappingURL=unite.js.map