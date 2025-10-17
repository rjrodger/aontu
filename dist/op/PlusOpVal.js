"use strict";
/* Copyright (c) 2024-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlusOpVal = void 0;
const val_1 = require("../val");
const OpBaseVal_1 = require("./OpBaseVal");
class PlusOpVal extends OpBaseVal_1.OpBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isOpVal = true;
    }
    make(_ctx, spec) {
        return new PlusOpVal(spec);
    }
    opname() {
        return 'plus';
    }
    operate(_ctx, args) {
        let a = this.primatize(args[0]?.peg);
        let b = this.primatize(args[1]?.peg);
        let peg = undefined;
        if (undefined === a && undefined !== b) {
            peg = b;
        }
        else if (undefined === b && undefined !== a) {
            peg = a;
        }
        else {
            const at = typeof a;
            const bt = typeof b;
            if ('boolean' === at && 'boolean' === bt) {
                peg = a || b;
            }
            else {
                peg = a + b;
            }
        }
        let pegtype = typeof peg;
        let out = undefined;
        if ('string' === pegtype) {
            out = new val_1.StringVal({ peg });
        }
        else if ('boolean' === pegtype) {
            out = new val_1.BooleanVal({ peg });
        }
        else if ('number' === pegtype) {
            out = Number.isInteger(peg) ? new val_1.IntegerVal({ peg }) : new val_1.NumberVal({ peg });
        }
        return out;
    }
    get canon() {
        return this.peg[0]?.canon + '+' + this.peg[1]?.canon;
    }
}
exports.PlusOpVal = PlusOpVal;
//# sourceMappingURL=PlusOpVal.js.map