"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdFuncVal = void 0;
exports.idName = idName;
const err_1 = require("../err");
const FuncBaseVal_1 = require("./FuncBaseVal");
const TopVal_1 = require("./TopVal");
const Val_1 = require("./Val");
// Letters, digits, `_`, `-`, `/` — and NO DOTS: a dot separates an
// entity address from a sub-path (G4 phase 2), so a dotted id would
// make `svc/auth.port` ambiguous between "the entity `svc/auth.port`"
// and "the port of `svc/auth`".
const ID_NAME = /^[A-Za-z0-9_/-]+$/;
// The name an argument spells, or undefined when it does not spell
// one. A bare `svc/auth` parses as a string, as does `"svc/auth"`;
// anything else — a number, a map, an unresolved reference — is not a
// name, and saying so at once beats an entity nobody can address.
function idName(v) {
    if (true !== v?.isScalar || 'string' !== typeof v.peg) {
        return undefined;
    }
    return ID_NAME.test(v.peg) ? v.peg : undefined;
}
class IdFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isIdFunc = true;
    }
    make(_ctx, spec) {
        return new IdFuncVal(spec);
    }
    funcname() {
        return 'id';
    }
    resolve(ctx, args) {
        const name = idName(args[0]);
        if (undefined === name) {
            return (0, err_1.makeNilErr)(ctx, 'id_name', this, undefined, 'id');
        }
        // THE UNIT, carrying the identity: `id(x) & v` must be `v` with an
        // identity, so the function resolves to what unifies with anything
        // and lets the rider in `unite` do the stamping.
        const out = new TopVal_1.TopVal({}, ctx);
        // NOT id 0: TopVal pins that, and `unite`'s fast path returns
        // early for two done Vals sharing an id — which would drop one of
        // two identities before the rider could refuse them.
        out.id = (0, Val_1.nextValId)();
        out.entity = name;
        return out;
    }
} /* node:coverage ignore next 6 */
exports.IdFuncVal = IdFuncVal;
//# sourceMappingURL=IdFuncVal.js.map