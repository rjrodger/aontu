"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathFuncVal = void 0;
const type_1 = require("../type");
const err_1 = require("../err");
const PathVal_1 = require("../val/PathVal");
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
            if (arg instanceof PathVal_1.PathVal) {
                // PathVal from dotted arg — resolve via find().
                const found = arg.find(ctx);
                if (found != null && !found.isNil) {
                    arg = found;
                }
                else {
                    arg.dc = type_1.DONE;
                }
            }
            else if (arg.isScalar && arg.peg != null && arg.peg !== ''
                && ('string' === typeof arg.peg || arg.isNumber)) {
                // String or number arg like path("foo") or path(0.2) — create a path value
                arg = this.place(new PathVal_1.PathVal({ peg: [arg], absolute: false }));
                arg.dc = type_1.DONE;
            }
            else if (arg.isNil || (arg.isScalar && (arg.peg === '' || arg.peg == null))) {
                arg = (0, err_1.makeNilErr)(ctx, 'invalid-arg', this);
            }
            // else: already resolved by preprocessing — pass through
        }
        args[0] = arg;
        this.prepared++;
        return args;
    }
    resolve(ctx, args) {
        let out = args[0] ?? (0, err_1.makeNilErr)(ctx, 'arg', this);
        if (out instanceof PathVal_1.PathVal) {
            const found = out.find(ctx);
            if (found != null && !found.isNil) {
                out = found;
            }
        }
        return out;
    }
}
exports.PathFuncVal = PathFuncVal;
//# sourceMappingURL=PathFuncVal.js.map