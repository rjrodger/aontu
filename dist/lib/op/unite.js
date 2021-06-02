"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.unite = void 0;
const val_1 = require("../val");
const unite = (ctx, a, b) => {
    let out = a;
    if (b && (val_1.TOP === a || !a)) {
        out = b;
    }
    else if (a && b && val_1.TOP !== b) {
        if (a instanceof val_1.Nil) {
            out = update(a, b);
        }
        else if (b instanceof val_1.Nil) {
            out = update(b, a);
        }
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
    return out;
};
exports.unite = unite;
function update(x, _y) {
    // TODO: update x with y.site
    return x;
}
//# sourceMappingURL=unite.js.map