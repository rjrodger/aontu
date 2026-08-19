"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferVal = exports.ReferFuncVal = void 0;
exports.parseAddress = parseAddress;
exports.findEntity = findEntity;
const type_1 = require("../type");
const err_1 = require("../err");
const FuncBaseVal_1 = require("./FuncBaseVal");
const FeatureVal_1 = require("./FeatureVal");
const StringVal_1 = require("./StringVal");
const unify_1 = require("../unify");
const top_1 = require("./top");
const utility_1 = require("../utility");
// A segment of the path INSIDE an entity. The entity name's own
// grammar (no dots) is what makes the split unambiguous: everything
// before the first dot names the entity, everything after walks its
// value.
const ADDR_SEGMENT = /^[A-Za-z0-9_-]+$/;
const ADDR_NAME = /^[A-Za-z0-9_/-]+$/;
// The address a string spells, or undefined when it does not spell
// one. `svc/auth` is the entity; `svc/auth.ports.http` is a node
// inside it — the two addressing schemes reconciled: `$.a.b` answers
// WHERE, an address answers WHAT, and beneath entity granularity the
// tree is authoritative again.
function parseAddress(s) {
    const parts = s.split('.');
    if (!ADDR_NAME.test(parts[0])) {
        return undefined;
    }
    for (const seg of parts.slice(1)) {
        if (!ADDR_SEGMENT.test(seg)) {
            return undefined;
        }
    }
    return { name: parts[0], path: parts.slice(1) };
}
// The value an address names, or undefined when the evaluation does
// not (yet) have one. Pending is not failure: an entity may be
// declared by a later conjunct, include or spread, so `refer`
// residuates exactly as a forward reference does.
function findEntity(reg, addr) {
    const rep = reg?.get(addr.name);
    if (null == rep) {
        return undefined;
    }
    let parent = undefined;
    let key = undefined;
    let val = rep;
    for (const seg of addr.path) {
        if (true !== val?.isMap && true !== val?.isList) {
            return undefined;
        }
        const next = val.peg[seg];
        if (null == next) {
            return undefined;
        }
        parent = val;
        key = seg;
        val = next;
    }
    return { parent, key, val };
}
// ReferVal is what `refer(t)` RESOLVES to: the residual constraint,
// carrying the type to flow and — once it has met a string — the
// address to flow it into. A separate value from the function for the
// reason every residual is: the function is written once and the
// constraint is met many times, and only the constraint has state
// worth carrying.
class ReferVal extends FeatureVal_1.FeatureVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isRefer = true;
        this.isGenable = true;
        this.tval = spec.tval ?? (0, top_1.top)();
        this.addr = spec.addr;
        this.addrsrc = spec.addrsrc;
        this.held = spec.held;
        this.dc = 0;
    }
    // NO clone or path-dependence hooks, deliberately. A spread template
    // holds the FUNCTION, not the residual — `&: refer(t)` is cloned per
    // destination as a `refer(...)` call, and each clone resolves to its
    // own ReferVal there — so a residual never travels: it is minted
    // where it is used. Both ports were written with the hooks and both
    // proved them dead (ADR-002 rule 4: gone rather than excused).
    unify(peer, ctx) {
        const p = peer;
        // Another `refer` at the same position: one constraint, both
        // types. `refer(A) & refer(B)` is a target that must be both.
        if (true === p?.isRefer) {
            return this.with(ctx, {
                tval: (0, unify_1.unite)(ctx, this.tval, p.tval, 'refer-t'),
                addr: this.addr ?? p.addr,
                addrsrc: this.addrsrc ?? p.addrsrc,
                held: null == this.held ? p.held
                    : null == p.held ? this.held
                        : (0, unify_1.unite)(ctx, this.held, p.held, 'refer-held'),
            }, this);
        }
        if (null == peer || true === p.isTop) {
            return this.settle(ctx, this);
        }
        if (true === p.isNil) {
            return peer;
        }
        // A STRING is the ADDRESS, when there is not one yet. It is the
        // only thing that can be: a link's value is its address.
        if (undefined === this.addr
            && true === p.isScalar && 'string' === typeof p.peg) {
            const addr = parseAddress(p.peg);
            if (undefined === addr) {
                return (0, err_1.makeNilErr)(ctx, 'refer_address', this, peer, 'refer', { addr: p.peg });
            }
            return this.with(ctx, { addr, addrsrc: p.peg }, peer);
        }
        // A value that can never BE a string cannot constrain one either,
        // and no later pass can repair it — so this arm refuses rather
        // than defers. A KIND or a constraint is not in it: `string`,
        // `re("^svc/")` and the like are perfectly good constraints on an
        // address, and are held below until there is one to apply them to.
        if ((true === p.isScalar && 'string' !== typeof p.peg)
            || true === p.isMap || true === p.isList) {
            return (0, err_1.makeNilErr)(ctx, 'refer_address', this, peer, 'refer');
        }
        // HELD: everything else waits for the address. Carried on the
        // residual rather than parked in a conjunct, because a conjunct
        // rebuilt every pass grows a level every pass; the held constraint
        // meets the link the moment the address resolves, so
        // `refer() & "x" & "y"` still conflicts and `refer() & string & "x"`
        // still passes.
        return this.with(ctx, {
            held: null == this.held ? peer : (0, unify_1.unite)(ctx, this.held, peer, 'refer-held'),
        }, this);
    }
    // with is the residual reshaped: every arm above answers a NEW
    // ReferVal rather than mutating this one, because a spread template's
    // residual is shared by every child it is applied to.
    with(ctx, spec, site) {
        const out = new ReferVal({}, ctx);
        out.tval = spec.tval ?? this.tval;
        out.addr = spec.addr ?? this.addr;
        out.addrsrc = spec.addrsrc ?? this.addrsrc;
        out.held = spec.held ?? this.held;
        (0, utility_1.propagateMarks)(this, out);
        out.site = site.site;
        out.path = this.path;
        return out.settle(ctx, site);
    }
    // settle answers the address if the evaluation can, and stays
    // pending if it cannot YET. `site` is the value whose position the
    // resolved string should take.
    settle(ctx, site) {
        if (undefined === this.addr) {
            this.dc = 0;
            return this;
        }
        const reg = ctx?.entities;
        const found = findEntity(reg, this.addr);
        if (undefined === found) {
            // PENDING, not failed — until the last pass. An entity may be
            // declared by a later conjunct, include or spread, so `refer`
            // residuates as a forward reference does; but within ONE
            // evaluation the document-set is fixed, so existence IS
            // decidable, and the final pass is where it is decided. A
            // pending refer keeps the tree not-done, so the pass loop always
            // reaches that pass when there is one to decide.
            if (ctx.cc + 1 >= ctx.budget.passes) {
                return (0, err_1.makeNilErr)(ctx, 'refer_unresolved', this, undefined, 'refer', { addr: this.addrsrc });
            }
            this.dc = 0;
            return this;
        }
        // THE FLOW. `t` is unified into the target and written back, so
        // every position of the entity carries it after the pass's
        // identity merge — the same channel the merge itself uses.
        if (!this.tval.isTop) {
            const merged = (0, unify_1.unite)(ctx, found.val, this.tval, 'refer-flow');
            if (true === merged.isNil) {
                return merged;
            }
            if (undefined === found.parent) {
                reg.set(this.addr.name, merged);
            }
            else {
                found.parent.peg[found.key] = merged;
            }
        }
        // The value IS the address string: a link, not an embedding.
        const out = new StringVal_1.StringVal({ peg: this.addrsrc }, ctx);
        out.dc = type_1.DONE;
        (0, utility_1.propagateMarks)(this, out);
        out.site = site.site;
        out.path = this.path;
        return null == this.held ? out : (0, unify_1.unite)(ctx, out, this.held, 'refer-held');
    }
    get canon() {
        const t = this.tval.isTop ? '' : this.tval.canon;
        const call = 'refer(' + t + ')' +
            (null == this.held ? '' : '&' + this.held.canon);
        return undefined === this.addrsrc
            ? call : call + '&' + JSON.stringify(this.addrsrc);
    }
}
exports.ReferVal = ReferVal;
class ReferFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isReferFunc = true;
    }
    make(_ctx, spec) {
        return new ReferFuncVal(spec);
    }
    funcname() {
        return 'refer';
    }
    resolve(ctx, args) {
        const out = new ReferVal({}, ctx);
        out.tval = 0 < args.length ? args[0] : (0, top_1.top)();
        out.site = this.site;
        out.path = this.path;
        return out;
    }
} /* node:coverage ignore next 6 */
exports.ReferFuncVal = ReferFuncVal;
//# sourceMappingURL=ReferFuncVal.js.map