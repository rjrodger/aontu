"use strict";
/* Copyright (c) 2024-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlusOpVal = void 0;
const IntegerVal_1 = require("../val/IntegerVal");
const NumberVal_1 = require("../val/NumberVal");
const StringVal_1 = require("../val/StringVal");
const BooleanVal_1 = require("../val/BooleanVal");
const OpBaseVal_1 = require("./OpBaseVal");
class PlusOpVal extends OpBaseVal_1.OpBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isPlusOp = true;
    }
    make(_ctx, spec) {
        return new PlusOpVal(spec);
    }
    opname() {
        return 'plus';
    }
    operate(_ctx, args) {
        // Only concrete scalar operands are valid: anything else (kinds,
        // maps, lists, null, top, funcs) must not coerce — the JS `+` would
        // leak internals like "[object Object]" into output. A non-scalar
        // operand leaves the op unresolved, which generate() reports.
        const prim = (v) => {
            // A pref operand contributes its preferred value (`pref(1)+2`).
            while (v?.isPref) {
                v = v.peg;
            }
            const p = v?.isVal && v.isScalar ? v.peg : undefined;
            const t = typeof p;
            return 'string' === t || 'number' === t || 'boolean' === t ? p : undefined;
        };
        let a = prim(args[0]);
        let b = prim(args[1]);
        if (undefined === a || undefined === b) {
            return undefined;
        }
        const at = typeof a;
        const bt = typeof b;
        let peg = undefined;
        if ('boolean' === at && 'boolean' === bt) {
            peg = a || b;
        }
        else if ('string' === at || 'string' === bt) {
            peg = String(a) + String(b);
        }
        else if ('boolean' === at || 'boolean' === bt) {
            // boolean mixed with a number does not coerce (no JS 0/1).
            return undefined;
        }
        else {
            peg = a + b;
        }
        let pegtype = typeof peg;
        let out = undefined;
        if ('string' === pegtype) {
            out = new StringVal_1.StringVal({ peg });
        }
        else if ('boolean' === pegtype) {
            out = new BooleanVal_1.BooleanVal({ peg });
        }
        else if ('number' === pegtype) {
            out = Number.isInteger(peg) ? new IntegerVal_1.IntegerVal({ peg }) : new NumberVal_1.NumberVal({ peg });
        }
        return out;
    }
    get canon() {
        return this.peg[0]?.canon + '+' + this.peg[1]?.canon;
    }
}
exports.PlusOpVal = PlusOpVal;
//# sourceMappingURL=PlusOpVal.js.map