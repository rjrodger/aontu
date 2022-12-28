"use strict";
/* Copyright (c) 2022 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOP = exports.DONE = void 0;
const lang_1 = require("./lang");
const DONE = -1;
exports.DONE = DONE;
// There can be only one.
const TOP = {
    isVal: true,
    id: 0,
    top: true,
    peg: undefined,
    done: DONE,
    path: [],
    row: -1,
    col: -1,
    url: '',
    unify(peer, _ctx) {
        return peer;
    },
    get canon() { return 'top'; },
    get site() { return new lang_1.Site(this); },
    same(peer) {
        return TOP === peer;
    },
    gen: (_ctx) => {
        return undefined;
    },
};
exports.TOP = TOP;
//# sourceMappingURL=type.js.map