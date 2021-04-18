"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Unify = exports.Context = void 0;
const val_1 = require("./val");
const lang_1 = require("./lang");
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
class Unify {
    constructor(root) {
        this.dc = 0;
        if ('string' === typeof root) {
            root = lang_1.AontuLang(root);
        }
        this.root = root;
        this.res = root;
        let res = root;
        let ctx;
        while (this.dc < 111 && val_1.DONE !== res.done) {
            ctx = new Context({ root: res });
            res = res.unify(val_1.TOP, ctx);
            this.dc++;
        }
        this.res = res;
    }
}
exports.Unify = Unify;
//# sourceMappingURL=unify.js.map