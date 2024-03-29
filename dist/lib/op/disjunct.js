"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.disjunct = void 0;
const DisjunctVal_1 = require("../val/DisjunctVal");
const ValBase_1 = require("../val/ValBase");
const disjunct = (ctx, a, b) => {
    let peers = [];
    let origsites = [];
    // origsites.push(append(peers, a))
    // origsites.push(append(peers, b))
    let out = new DisjunctVal_1.DisjunctVal({ peg: peers }, ctx, origsites);
    return out;
};
exports.disjunct = disjunct;
function append(peers, v) {
    // let origsite: Site = Site.NONE
    if (v.isDisjunctVal) {
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