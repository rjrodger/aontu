"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaceVal = void 0;
exports.hasPlace = hasPlace;
exports.fillPlace = fillPlace;
const Val_1 = require("./Val");
class PlaceVal extends Val_1.Val {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isPlace = true;
    }
    unify(peer, _ctx) {
        // The peer FILLS the hole. Against TOP there is nothing to fill it
        // with, so it waits -- and waiting is not done, or a call holding
        // it would resolve around it.
        if (peer.isTop) {
            this.notdone();
            return this;
        }
        return peer;
    }
    get canon() {
        return '_';
    }
    // A hole admits everything, so nothing sits above it -- the same
    // answer TOP gives, for the same reason.
    superior() {
        return this;
    }
}
exports.PlaceVal = PlaceVal;
// Does this value CONTAIN a hole? Asked of a call before it resolves:
// a call holding one must wait for a peer to fill it.
function hasPlace(v) {
    if (true === v.isPlace) {
        return true;
    }
    const peg = v.peg;
    if (Array.isArray(peg)) {
        for (const c of peg) {
            if (true === c?.isVal && hasPlace(c)) {
                return true;
            }
        }
    }
    else if (true === peg?.isVal) {
        return hasPlace(peg);
    }
    else if (null != peg && 'object' === typeof peg) {
        for (const k of Object.keys(peg)) {
            if (true === peg[k]?.isVal && hasPlace(peg[k])) {
                return true;
            }
        }
    }
    return false;
}
// The same tree with every hole filled by `fill`. Answers the value
// UNCHANGED when it holds no hole, so a caller can test identity to
// know whether anything was filled -- and so a tree with no hole is
// never needlessly cloned.
function fillPlace(v, fill, ctx) {
    if (true === v.isPlace) {
        return fill;
    }
    const peg = v.peg;
    if (Array.isArray(peg)) {
        let changed = false;
        const out = peg.map((c) => {
            if (true !== c?.isVal) {
                return c;
            }
            const f = fillPlace(c, fill, ctx);
            changed = changed || f !== c;
            return f;
        });
        return changed ? rebuild(v, out, ctx) : v;
    }
    if (true === peg?.isVal) {
        const f = fillPlace(peg, fill, ctx);
        return f === peg ? v : rebuild(v, f, ctx);
    }
    if (null != peg && 'object' === typeof peg) {
        let changed = false;
        const out = {};
        for (const k of Object.keys(peg)) {
            const c = peg[k];
            // No isVal guard: a slot holding something that is not a Val
            // answers itself, because fillPlace's own first tests -- is it a
            // hole, has it a peg -- are both false for one.
            const f = fillPlace(c, fill, ctx);
            changed = changed || f !== c;
            out[k] = f;
        }
        return changed ? rebuild(v, out, ctx) : v;
    }
    return v;
}
// A clone carrying a new peg. `clone` shares the peg by reference (see
// Val.clone), which is exactly what must NOT happen here: the tree
// being filled is a template, and the fill is one destination's.
function rebuild(v, peg, ctx) {
    const out = v.clone(ctx);
    out.peg = peg;
    out.dc = 0;
    return out;
} /* node:coverage ignore next 8 */
//# sourceMappingURL=PlaceVal.js.map