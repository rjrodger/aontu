"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopVal = exports.TOP = void 0;
const type_1 = require("../type");
const lang_1 = require("../lang");
const BaseVal_1 = require("./BaseVal");
// There can be only one.
class TopVal extends BaseVal_1.BaseVal {
    constructor() {
        super({ peg: null });
        this.isTop = true;
        this.id = 0;
        this.top = true;
        this.peg = undefined;
        this.dc = type_1.DONE;
        this.path = [];
        this.row = -1;
        this.col = -1;
        this.url = '';
        // TOP is always DONE, by definition.
        this.dc = type_1.DONE;
    }
    unify(peer, _ctx) {
        return peer;
    }
    get canon() { return 'top'; }
    get site() { return new lang_1.Site(this); }
    same(peer) {
        return this === peer;
    }
    clone(_ctx, _spec) {
        return this;
    }
    gen(_ctx) {
        return undefined;
    }
}
exports.TopVal = TopVal;
const TOP = new TopVal();
exports.TOP = TOP;
//# sourceMappingURL=TopVal.js.map