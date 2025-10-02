"use strict";
/* Copyright (c) 2024 Richard Rodger, MIT License */
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
exports.PlusOpVal = PlusOpVal;
//# sourceMappingURL=PlusOpVal.js.map