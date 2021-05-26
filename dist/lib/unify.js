"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Unify = exports.Context = void 0;
const val_1 = require("./val");
const lang_1 = require("./lang");
//type MapMap = { [name: string]: { [key: string]: any } }
class Context {
    //map: MapMap
    constructor(cfg) {
        this.root = cfg.root;
        this.path = [];
        this.err = cfg.err || [];
        //this.map = cfg.map || { url: {} }
    }
    descend(key) {
        let cfg = {
            root: this.root,
            err: this.err,
            // map: this.map,
        };
        let ctx = new Context(cfg);
        ctx.err = this.err;
        ctx.path = this.path.concat(key);
        return ctx;
    }
    find(ref) {
        // TODO: relative paths
        if (this.root instanceof val_1.MapVal && ref.absolute) {
            let node = this.root;
            let pI = 0;
            for (; pI < ref.parts.length && node instanceof val_1.MapVal; pI++) {
                let part = ref.parts[pI];
                node = node.peg[part];
            }
            if (pI === ref.parts.length) {
                return node;
            }
        }
    }
}
exports.Context = Context;
class Unify {
    constructor(root, lang) {
        // map: MapMap
        this.dc = 0;
        this.lang = lang || new lang_1.Lang();
        if ('string' === typeof root) {
            root = this.lang.parse(root);
        }
        // console.log('ROOT', root.canon, root.url)
        this.root = root;
        this.res = root;
        this.err = [];
        //this.map = {
        //  url: {}
        //}
        let res = root;
        let ctx;
        while (this.dc < 111 && val_1.DONE !== res.done) {
            ctx = new Context({
                root: res,
                err: this.err,
                // map: this.map
            });
            res = res.unify(val_1.TOP, ctx);
            // console.log('U', this.dc, this.map)
            this.dc++;
        }
        this.res = res;
    }
}
exports.Unify = Unify;
//# sourceMappingURL=unify.js.map