"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = void 0;
const val_1 = require("./val");
class Context {
    constructor(cfg) {
        this.root = cfg.root;
    }
    find(ref) {
        // TODO: relative paths
        if (ref.absolute) {
            let node = this.root;
            let pI = 0;
            for (; pI < ref.parts.length && node instanceof val_1.MapVal; pI++) {
                let part = ref.parts[pI];
                node = node.val[part];
            }
            if (pI === ref.parts.length) {
                return node;
            }
        }
    }
}
exports.Context = Context;
//# sourceMappingURL=unify.js.map