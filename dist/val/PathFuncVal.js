"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathFuncVal = void 0;
const NilVal_1 = require("../val/NilVal");
const RefVal_1 = require("../val/RefVal");
const FuncBaseVal_1 = require("./FuncBaseVal");
class PathFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isPathFunc = true;
        this.prepared = 0;
    }
    make(_ctx, spec) {
        const pathfunc = new PathFuncVal(spec);
        pathfunc.prepared = this.prepared;
        return pathfunc;
    }
    funcname() {
        return 'path';
    }
    prepare(ctx, args) {
        let arg = args[0];
        if (0 === this.prepared) {
            if (arg.isScalar) {
                arg = this.place(new RefVal_1.RefVal({ peg: [arg], absolute: false }));
            }
            else if (!arg.isRef) {
                arg = NilVal_1.NilVal.make(ctx, 'invalid-arg', this);
            }
        }
        args[0] = arg;
        this.prepared++;
        return args;
    }
    resolve(ctx, args) {
        let out = args[0] ?? NilVal_1.NilVal.make(ctx, 'arg', this);
        return out;
    }
}
exports.PathFuncVal = PathFuncVal;
//# sourceMappingURL=PathFuncVal.js.map