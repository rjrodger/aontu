"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpreadVal = void 0;
const type_1 = require("../type");
const unify_1 = require("../unify");
const utility_1 = require("../utility");
const top_1 = require("./top");
const FeatureVal_1 = require("./FeatureVal");
const ConjunctVal_1 = require("./ConjunctVal");
const MapVal_1 = require("./MapVal");
const ListVal_1 = require("./ListVal");
class SpreadVal extends FeatureVal_1.FeatureVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isSpread = true;
        this.isGenable = true;
        this.cjo = 110000; // Sorts after MapVal/ListVal in ConjunctVal norm
    }
    unify(peer, ctx) {
        peer = peer ?? (0, top_1.top)();
        const te = ctx.explain && (0, utility_1.explainOpen)(ctx, ctx.explain, 'Spread', this, peer);
        let out;
        if (peer.isTop) {
            // Self-unify: spread is a constraint, not a value that converges.
            // Mark done to prevent fixpoint cycling.
            out = this;
            out.dc = type_1.DONE;
        }
        else if (peer.isSpread) {
            // SpreadVal + SpreadVal: unify the two constraints
            const merged = (0, unify_1.unite)(te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'SPR') }) : ctx, this.peg, peer.peg, 'spread-merge');
            out = new SpreadVal({ peg: merged }, ctx);
            out.dc = merged.done ? type_1.DONE : this.dc + 1;
        }
        else if (peer.isMap) {
            // SpreadVal + MapVal: apply spread to each map key
            out = this.applyToMap(peer, ctx, te);
        }
        else if (peer.isList) {
            // SpreadVal + ListVal: apply spread to each list element
            out = this.applyToList(peer, ctx, te);
        }
        else if (peer.isConjunct) {
            // SpreadVal + ConjunctVal: unify with the conjunct.
            // The conjunct fold will place us last (high cjo).
            out = peer.unify(this, te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'SCJ') }) : ctx);
        }
        else {
            // SpreadVal + other: defer by wrapping in ConjunctVal
            out = new ConjunctVal_1.ConjunctVal({ peg: [peer, this] }, ctx);
            out.dc = this.dc + 1;
        }
        ctx.explain && (0, utility_1.explainClose)(te, out);
        return out;
    }
    // Apply this spread constraint to each key in a MapVal.
    // Uses unite() per key with the correct descended context.
    applyToMap(map, ctx, te) {
        const spread = this.peg;
        const mapKeys = Object.keys(map.peg);
        // If map has no keys, preserve the spread for future merges.
        // Mark as DONE to prevent fixpoint cycling.
        if (mapKeys.length === 0) {
            const out = new ConjunctVal_1.ConjunctVal({ peg: [map, this] }, ctx);
            out.dc = type_1.DONE;
            return out;
        }
        const out = new MapVal_1.MapVal({ peg: {} }, ctx);
        out.closed = map.closed;
        out.optionalKeys = 0 < map.optionalKeys.length
            ? [...map.optionalKeys] : map.optionalKeys;
        out.site = map.site;
        let done = true;
        for (const key of mapKeys) {
            const child = map.peg[key];
            const keyctx = ctx.descend(key);
            // Clone the spread for this key's context, then resolve any
            // path-dependent functions (key(), path(), etc.) by unifying
            // with TOP. This ensures the spread values are concrete before
            // being merged as peer keys into the child map.
            let key_spread = spread.spreadClone(keyctx);
            if (!key_spread.done) {
                key_spread = (0, unify_1.unite)(keyctx, key_spread, (0, top_1.top)(), 'spread-resolve');
            }
            (0, utility_1.propagateMarks)(map, child);
            out.peg[key] =
                undefined === child ? key_spread :
                    child.isNil ? child :
                        key_spread.isNil ? key_spread :
                            key_spread.isTop && child.done ? child :
                                child.isTop && key_spread.done ? key_spread :
                                    (0, unify_1.unite)(te ? keyctx.clone({ explain: (0, utility_1.ec)(te, 'SK:' + key) }) : keyctx, child, key_spread, 'spread-apply');
            done = done && (type_1.DONE === out.peg[key].dc);
        }
        out.dc = done ? type_1.DONE : map.dc + 1;
        (0, utility_1.propagateMarks)(map, out);
        (0, utility_1.propagateMarks)(this, out);
        // Stamp applied spreads so ref copies carry them.
        // Merge with any spreads already on the map.
        out._spread = map._spread.length > 0
            ? [...map._spread, this] : [this];
        return out;
    }
    // Apply this spread constraint to each element in a ListVal.
    applyToList(list, ctx, te) {
        const spread = this.peg;
        const listKeys = Object.keys(list.peg);
        if (listKeys.length === 0) {
            const out = new ConjunctVal_1.ConjunctVal({ peg: [list, this] }, ctx);
            out.dc = type_1.DONE;
            return out;
        }
        const out = new ListVal_1.ListVal({ peg: [] }, ctx);
        out.closed = list.closed;
        out.optionalKeys = 0 < list.optionalKeys.length
            ? [...list.optionalKeys] : list.optionalKeys;
        out.site = list.site;
        let done = true;
        for (const key of listKeys) {
            const child = list.peg[key];
            const keyctx = ctx.descend(key);
            const key_spread = spread.spreadClone(keyctx);
            (0, utility_1.propagateMarks)(list, child);
            out.peg[key] =
                undefined === child ? key_spread :
                    child.isNil ? child :
                        key_spread.isNil ? key_spread :
                            key_spread.isTop && child.done ? child :
                                child.isTop && key_spread.done ? key_spread :
                                    (0, unify_1.unite)(te ? keyctx.clone({ explain: (0, utility_1.ec)(te, 'SL:' + key) }) : keyctx, child, key_spread, 'spread-apply-list');
            done = done && (type_1.DONE === out.peg[key]?.dc);
        }
        out.dc = done ? type_1.DONE : list.dc + 1;
        (0, utility_1.propagateMarks)(list, out);
        (0, utility_1.propagateMarks)(this, out);
        out._spread = list._spread.length > 0
            ? [...list._spread, this] : [this];
        return out;
    }
    clone(ctx, spec) {
        const out = new SpreadVal({
            peg: this.peg.clone(ctx, spec),
            ...(spec || {}),
        }, ctx);
        out.dc = this.done ? type_1.DONE : out.dc;
        out.site = this.site;
        return out;
    }
    spreadClone(ctx) {
        if (!this.isPathDependent)
            return this;
        return this.clone(ctx);
    }
    get canon() {
        // Use {&:...} for map spreads, [&:...] for list spreads, {&:X} for scalars
        const pc = this.peg.canon;
        if (this.peg.isMap)
            return '{&:' + pc.slice(1, -1) + '}'; // {&:k:v,...}
        if (this.peg.isList)
            return '[&:' + pc.slice(1, -1) + ']'; // [&:v,...]
        return '{&:' + pc + '}';
    }
    gen(_ctx) {
        // Unresolved spread (never applied to a map/list) generates
        // as undefined — the spread is a constraint, not a value.
        return undefined;
    }
    inspection() {
        return 'spread';
    }
}
exports.SpreadVal = SpreadVal;
//# sourceMappingURL=SpreadVal.js.map