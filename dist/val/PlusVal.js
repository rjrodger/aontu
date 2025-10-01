"use strict";
/* Copyright (c) 2024 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlusVal = void 0;
const val_1 = require("../val");
const OpVal_1 = require("./OpVal");
class PlusVal extends OpVal_1.OpVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isOpVal = true;
    }
    make(_ctx, spec) {
        return new PlusVal(spec);
    }
    opname() {
        return 'plus';
    }
    operate(ctx, args) {
        // super.operate(ctx)
        // if (this.peg.find((v: any) => v.isRefVal)) {
        //   return undefined
        // }
        let peg = args[0].peg + args[1].peg;
        let pegtype = typeof peg;
        if ('string' === pegtype) {
            return new val_1.StringVal({ peg });
        }
        else if ('number' === pegtype) {
            return Number.isInteger(peg) ? new val_1.IntegerVal({ peg }) : new val_1.NumberVal({ peg });
        }
        return undefined;
    }
    get canon() {
        return this.peg[0]?.canon + '+' + this.peg[1]?.canon;
    }
}
exports.PlusVal = PlusVal;
//# sourceMappingURL=PlusVal.js.map