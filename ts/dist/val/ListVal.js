"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListVal = void 0;
const type_1 = require("../type");
const unify_1 = require("../unify");
const utility_1 = require("../utility");
const err_1 = require("../err");
const top_1 = require("./top");
const ConjunctVal_1 = require("./ConjunctVal");
const BagVal_1 = require("./BagVal");
const provenance_1 = require("../provenance");
class ListVal extends BagVal_1.BagVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isList = true;
        if (null == this.peg) {
            throw new err_1.AontuError('ListVal spec.peg undefined');
        }
        let spread = this.peg[type_1.SPREAD];
        delete this.peg[type_1.SPREAD];
        if (spread) {
            if ('&' === spread.o) {
                // TODO: handle existing spread!
                this.spread.cj =
                    Array.isArray(spread.v) ?
                        1 < spread.v.length ?
                            new ConjunctVal_1.ConjunctVal({ peg: spread.v }, ctx) :
                            spread.v[0] :
                        spread.v;
                // let tmv = Array.isArray(spread.v) ? spread.v : [spread.v]
                // this.spread.cj = new ConjunctVal({ peg: tmv }, ctx)
            }
        }
    }
    // NOTE: order of keys is not preserved!
    // not possible in any case - consider {a,b} unify {b,a}
    unify(peer, ctx) {
        const TOP = (0, top_1.top)();
        peer = peer ?? TOP;
        // A sizing residual (`length`, `unique`) sorts AFTER containers in a
        // conjunct so that it counts the MERGED list rather than the first
        // fragment (SIZING_CJO in ConstraintVal.ts). That makes the list the
        // accumulator and the constraint its peer, the reverse of the usual
        // order — and the reading belongs to the constraint either way, so
        // hand it straight back.
        if (true === peer.isConstraint) {
            return peer.unify(this, ctx);
        }
        const te = ctx.explain && (0, utility_1.explainOpen)(ctx, ctx.explain, 'List', this, peer);
        let done = true;
        let exit = false;
        // NOTE: not a clone! needs to be constructed.
        let out = (peer.isTop ? this : new ListVal({ peg: [] }, ctx));
        out.closed = this.closed;
        out.optionalKeys = [...this.optionalKeys];
        out.spread.cj = this.spread.cj;
        out.site = this.site;
        if (peer instanceof ListVal) {
            if (!this.closed && peer.closed) {
                out = peer.unify(this, te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'PMC') }) : ctx);
                exit = true;
            }
            else {
                out.closed = out.closed || peer.closed;
                out.spread.cj = null == out.spread.cj ? peer.spread.cj : (null == peer.spread.cj ? out.spread.cj : (out.spread.cj =
                    (0, unify_1.unite)(te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'SPR') }) : ctx, out.spread.cj, peer.spread.cj, 'list-peer')));
            }
        }
        if (!exit) {
            out.dc = this.dc + 1;
            let spread_cj = out.spread.cj || TOP;
            // Always unify children first
            for (let key in this.peg) {
                const keyctx = ctx.descend(key);
                const key_spread_cj = spread_cj.spreadClone(keyctx);
                // The spread mark the provenance recorder reads (G7 phase 3),
                // as in MapVal: this is where a template becomes a per-element
                // contribution. Instrumented runs only.
                if (undefined !== keyctx.prov) {
                    (0, provenance_1.markSpread)(key_spread_cj);
                }
                const child = this.peg[key];
                (0, utility_1.propagateMarks)(this, child);
                // child is non-nullish: propagateMarks above dereferences it.
                out.peg[key] =
                    child.isNil ? child :
                        key_spread_cj.isNil ? key_spread_cj :
                            // The no-op meet is SKIPPED on the normal path (it is the
                            // identity) but TAKEN while recording: a value written once
                            // and never met is still a contribution the author wants
                            // pointed at, and the Go port's unite sees that meet (G7
                            // phase 4). Instrumented runs pay knowingly.
                            key_spread_cj.isTop && child.done && undefined === keyctx.prov
                                ? child :
                                child.isTop && key_spread_cj.done ? key_spread_cj :
                                    (0, unify_1.unite)(te ? keyctx.clone({ explain: (0, utility_1.ec)(te, 'PEG:' + key) }) : keyctx, child, key_spread_cj, 'list-own');
                done = (done && type_1.DONE === out.peg[key].dc);
            }
            const allowedKeys = this.closed ? Object.keys(this.peg) : [];
            let bad = undefined;
            if (peer instanceof ListVal) {
                let upeer = peer.done ? peer : (0, unify_1.unite)(te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'PER') }) : ctx, peer, TOP, 'list-peer-list');
                // NOTE: peerkey is the index
                for (let peerkey in upeer.peg) {
                    let peerchild = upeer.peg[peerkey];
                    if (this.closed && !allowedKeys.includes(peerkey)) {
                        bad = (0, err_1.makeNilErr)(ctx, 'closed', peerchild, undefined);
                    }
                    let child = out.peg[peerkey];
                    const peerctx = ctx.descend(peerkey);
                    let oval = out.peg[peerkey] =
                        undefined === child ? peerchild :
                            child.isTop && peerchild.done ? peerchild :
                                child.isNil ? child :
                                    peerchild.isNil ? peerchild :
                                        (0, unify_1.unite)(te ? peerctx.clone({ explain: (0, utility_1.ec)(te, 'CHD') }) : peerctx, child, peerchild, 'list-peer');
                    if (this.spread.cj) {
                        let key_spread_cj = spread_cj.spreadClone(peerctx);
                        if (undefined !== peerctx.prov) {
                            (0, provenance_1.markSpread)(key_spread_cj);
                        }
                        oval = out.peg[peerkey] =
                            (0, unify_1.unite)(te ? peerctx.clone({ explain: (0, utility_1.ec)(te, 'PSP:' + peerkey) }) : peerctx, out.peg[peerkey], key_spread_cj, 'list-spread');
                    }
                    (0, utility_1.propagateMarks)(this, oval);
                    done = (done && type_1.DONE === oval.dc);
                }
            }
            else if (!peer.isTop) {
                out = (0, err_1.makeNilErr)(ctx, 'list', this, peer);
            }
            if (null != bad) {
                out = bad;
            }
            if (!out.isNil) {
                ;
                (out.uh ??= []).push(peer.id);
                out.dc = done ? type_1.DONE : out.dc;
                (0, utility_1.propagateMarks)(peer, out);
                (0, utility_1.propagateMarks)(this, out);
            }
        }
        ctx.explain && (0, utility_1.explainClose)(te, out);
        return out;
    }
    // Spread clone: only deep-clone children that are path-dependent
    // (isFunc, isRef). Share all other children directly.
    // Spread clone: when all children are ScalarKindVal (simple type
    // constraints like `string`, `number`), share them directly to avoid
    // N x M allocations. ScalarKindVal is safe to share: it is immutable,
    // always done, never path-dependent, and never has marks mutated.
    // For anything more complex, fall back to full deep clone.
    spreadClone(ctx) {
        // B1: share directly when the spread tree has no path-dependent
        // leaves. See MapVal.spreadClone for rationale.
        if (!this.isPathDependent)
            return this;
        let allScalarKind = true;
        for (let key in this.peg) {
            if (!this.peg[key]?.isScalarKind) {
                allScalarKind = false;
                break;
            }
        }
        if (!allScalarKind) {
            return this.clone(ctx);
        }
        let out = super.clone(ctx);
        for (let entry of Object.entries(this.peg)) {
            out.peg[entry[0]] = entry[1];
        }
        // Must create a new spread object to avoid mutating the original.
        out.spread = {
            cj: this.spread.cj ? this.spread.cj.spreadClone(ctx) : undefined,
        };
        out.closed = this.closed;
        out.optionalKeys = [...this.optionalKeys];
        return out;
    }
    clone(ctx, spec) {
        let out = super.clone(ctx, spec);
        for (let entry of Object.entries(this.peg)) {
            out.peg[entry[0]] =
                entry[1]?.isVal ? entry[1].clone(ctx, spec?.mark ? { mark: spec.mark } : {}) : entry[1];
        }
        if (this.spread.cj) {
            out.spread.cj = this.spread.cj.clone(ctx, spec?.mark ? { mark: spec.mark } : {});
        }
        out.closed = this.closed;
        out.optionalKeys = [...this.optionalKeys];
        // console.log('LISTVAL-CLONE', this.canon, '->', out.canon)
        return out;
    }
    get canon() {
        // console.log('LISTVAL-CANON', this.optionalKeys)
        let keys = Object.keys(this.peg);
        return '' +
            // this.errcanon() +
            '[' +
            (this.spread.cj ? '&:' + this.spread.cj.canon +
                (0 < keys.length ? ',' : '') : '') +
            // No optional-element rendering. A list HAS no optional elements to
            // render: a key:value pair in list position contributes no element
            // at all, in either spelling and whatever its key (issue #40), so
            // nothing a source can write reaches this method with an optional
            // key. The Go port's ListVal.Canon has no such arm either, and the
            // two canons must agree -- a canon is round-trippable, and a marker
            // on an element the grammar cannot produce would not reparse.
            // canonDeprecation, not .canon: a deprecated element renders
            // back as its `deprecate(x, m)` call, reparseably (G3).
            keys.map(k => (0, utility_1.canonDeprecation)(this.peg[k])).join(',') +
            ']';
    }
} /* node:coverage ignore next 8 */
exports.ListVal = ListVal;
//# sourceMappingURL=ListVal.js.map