"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopVal = void 0;
const type_1 = require("../type");
const BaseVal_1 = require("./BaseVal");
// There can be only one.
class TopVal extends BaseVal_1.BaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isTop = true;
        this.id = 0;
        this.dc = type_1.DONE;
        // TOP is always DONE, by definition.
        this.dc = type_1.DONE;
        this.mark.type = false;
        this.mark.hide = false;
    }
    same(peer) {
        // return this === peer
        return peer.isTop;
    }
    unify(peer, _ctx) {
        return peer;
    }
    get canon() { return 'top'; }
    clone(_ctx, _spec) {
        return this;
    }
    gen(_ctx) {
        return undefined;
    }
}
exports.TopVal = TopVal;
//# sourceMappingURL=TopVal.js.map