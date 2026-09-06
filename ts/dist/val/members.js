"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.bagMembers = bagMembers;
exports.memberVals = memberVals;
const keyorder_1 = require("../keyorder");
const Val_1 = require("./Val");
const BagVal_1 = require("./BagVal");
function bagMembers(data, ctx) {
    if (true !== data?.isMap && true !== data?.isList) {
        return undefined;
    }
    const keys = true === data.isMap ?
        Object.keys(data.peg).sort(keyorder_1.cmpCodePoint) :
        data.peg.map((_v, i) => '' + i);
    // A member marked while its bag is not was marked in its own right,
    // and is left out as generation leaves it out. Under a MARKED bag
    // every child carries the mark (hide() and type() mark to the
    // leaves), so there the mark says nothing about the member and every
    // child is one -- the members of a hidden bag are what the bag
    // holds, exactly as a reference to it lifts them.
    const lifted = true === data.mark.hide || true === data.mark.type;
    const out = [];
    for (const key of keys) {
        const val = data.peg[key];
        if ((!lifted && (true === val.mark.hide || true === val.mark.type))
            || data.aliasKeys.includes(key)) {
            continue;
        }
        if (data.optionalKeys.includes(key) && !filled(val, ctx)) {
            continue;
        }
        out.push({ key, val });
    }
    return out;
}
// An optional child is a member when it generates something, decided
// as BagVal.gen decides it: in an isolated collect context, so residue
// inside an absent optional subtree is dropped rather than raised.
function filled(val, ctx) {
    if (!(0, BagVal_1.bagGenable)(val)) {
        return false;
    }
    const cval = val.gen(ctx.clone({ err: [], collect: true }));
    return undefined !== cval && !(0, Val_1.empty)(cval);
}
// The member values alone, for the verbs that do not need the keys.
function memberVals(data, ctx) {
    const members = bagMembers(data, ctx);
    return undefined === members ? undefined : members.map((m) => m.val);
}
//# sourceMappingURL=members.js.map