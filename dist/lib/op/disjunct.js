"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.disjunct = void 0;
const val_1 = require("../val");
const ValBase_1 = require("../val/ValBase");
const disjunct = (ctx, a, b) => {
    let peers = [];
    let origsites = [];
    // origsites.push(append(peers, a))
    // origsites.push(append(peers, b))
    let out = new val_1.DisjunctVal(peers, ctx, origsites);
    return out;
};
exports.disjunct = disjunct;
function append(peers, v) {
    // let origsite: Site = Site.NONE
    if (v instanceof val_1.DisjunctVal) {
        peers.push(...v.peg);
        // origsite = v.site
    }
    // TODO: handle no-error Nil (drop) and error Nil (keep and become)
    else if (v instanceof ValBase_1.ValBase) {
        peers.push(v);
    }
    // return origsite
}
//# sourceMappingURL=disjunct.js.map