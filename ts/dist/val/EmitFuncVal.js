"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmitFuncVal = void 0;
const unify_1 = require("../unify");
const err_1 = require("../err");
const escape_1 = require("../escape");
const keyorder_1 = require("../keyorder");
const top_1 = require("./top");
const ListVal_1 = require("./ListVal");
const StringVal_1 = require("./StringVal");
const FuncBaseVal_1 = require("./FuncBaseVal");
const Val_1 = require("./Val");
const PlaceVal_1 = require("./PlaceVal");
const PlusOpVal_1 = require("./PlusOpVal");
const EachFuncVal_1 = require("./EachFuncVal");
function isRefusal(x) {
    return 'string' === typeof x.code;
}
// Read the table. A map is one template; a list is many. The shape is
// checked here rather than at the call, because a table is ordinary
// data and may be computed.
function tableTemplates(table) {
    const t = table;
    // A NAMED TABLE IS A PLACEHELD `emit`, and its table is the table.
    // A table written at a document position is DRIVEN there -- a body's
    // relative references resolve against wherever it sits and miss --
    // so the position that holds one unevaluated is the one position the
    // language already never drives: a call's template argument.
    // `%wire = emit(_, [ … ])` is that position with the selection left
    // open, and it reads as what it is, an apply-templates waiting for
    // its nodes: `emit(.listen, %wire)` passes them, `.listen & %wire`
    // fills the hole, and both are the same dispatch.
    if (true === t?.isEmitFunc) {
        return tableTemplates(t.peg[1]);
    }
    if (true === t?.isMap) {
        const one = oneTemplate(t);
        return isRefusal(one) ? one : [one];
    }
    if (true === t?.isList) {
        const out = [];
        for (const el of t.peg) {
            const e = el;
            if (true !== e?.isMap) {
                return { code: 'emit_template' };
            }
            const one = oneTemplate(e);
            if (isRefusal(one)) {
                return one;
            }
            out.push(one);
        }
        return out;
    }
    return { code: 'emit_table' };
}
// One rule. Both keys are required: a template with no pattern would
// match everything by accident, and one with no body would emit
// nothing while claiming a node. The two optional keys -- a `replace`
// map and an `esc` naming the convention its values are escaped by,
// `none` the one opt-out -- are the template's shape too, and D3's two
// static checks run here, on the template alone, before any node.
function oneTemplate(m) {
    const match = m.peg.match;
    const body = m.peg.body;
    if (null == match || null == body) {
        return { code: 'emit_template' };
    }
    if (true !== body.isList) {
        return { code: 'emit_body' };
    }
    const replace = m.peg.replace;
    if (null != replace && true !== replace.isMap) {
        return { code: 'emit_template' };
    }
    const escv = m.peg.esc;
    let esc = '';
    if (null != escv) {
        const name = textOf(escv);
        if (undefined === name || ('none' !== name && !(0, escape_1.isEscVariant)(name))) {
            return { code: 'esc_variant' };
        }
        esc = name;
    }
    const lits = literalSpots(body.peg);
    if (null != replace) {
        const bad = checkReplace(Object.keys(replace.peg), lits);
        if (undefined !== bad) {
            return bad;
        }
    }
    return { match, body, replace, esc, lits };
}
// The string a value carries, or undefined when it is not a string.
function textOf(v) {
    return true === v?.isScalar && 'string' === typeof v.peg ? v.peg : undefined;
}
// The literal strings of a body -- a string element, and the strings
// written directly in a map element's `of` list or `text` -- which are
// the text the template wrote. A string an expression or a nested
// dispatch computes is not one: D3's third rule (a spliced result is
// finished) and its second (a substituted value is never re-scanned)
// both follow from substituting at these spots and nowhere else.
function literalSpots(elems) {
    const out = [];
    elems.forEach((el, i) => {
        const s = textOf(el);
        if (undefined !== s) {
            out.push({ i, s });
            return;
        }
        if (true !== el?.isMap) {
            return;
        }
        const of = el.peg.of;
        if (true === of?.isList) {
            of.peg.forEach((p, j) => {
                const ps = textOf(p);
                if (undefined !== ps) {
                    out.push({ i, of: j, s: ps });
                }
            });
        }
        const ts = textOf(el.peg.text);
        if (undefined !== ts) {
            out.push({ i, text: true, s: ts });
        }
    });
    return out;
}
// D3's two static checks, on the template alone and before any node:
// a key inside another is ambiguous whatever the order
// (replace_overlap), and a key no literal holds means the template
// drifted from its map (replace_unused). Keys are visited in code
// point order, so both ports name the same pair.
function checkReplace(keys, lits) {
    const sorted = [...keys].sort(keyorder_1.cmpCodePoint);
    for (const a of sorted) {
        for (const b of sorted) {
            if (a !== b && b.includes(a)) {
                return { code: 'replace_overlap', details: { key: quoted(a), other: quoted(b) } };
            }
        }
    }
    for (const k of sorted) {
        if ('' === k || !lits.some((l) => l.s.includes(k))) {
            return { code: 'replace_unused', details: { key: quoted(k) } };
        }
    }
    return undefined;
}
// D3's first two rules as one scan: at each position the longest key
// that matches is taken and its value written out whole, and the scan
// moves past the KEY -- the value is never looked at again, so no
// value can introduce a key.
function substitute(text, pairs) {
    let out = '';
    let i = 0;
    while (i < text.length) {
        const hit = pairs.find((p) => text.startsWith(p[0], i));
        if (undefined === hit) {
            out += text[i];
            i += 1;
        }
        else {
            out += hit[1];
            i += hit[0].length;
        }
    }
    return out;
}
// The instance with the template's literal text at element `i`
// rewritten through the pairs -- on the fresh instance, where the
// structure is exactly the template's, and before any binding, so a
// value written in is never scanned again and a spliced result is
// never touched.
function substituted(inst, i, lits, pairs, ctx) {
    for (const l of lits) {
        if (l.i !== i) {
            continue;
        }
        const sv = new StringVal_1.StringVal({ peg: substitute(l.s, pairs) }, ctx);
        if (undefined !== l.of) {
            inst.peg.of.peg[l.of] = sv;
        }
        else if (true === l.text) {
            inst.peg.text = sv;
        }
        else {
            inst = sv;
        }
    }
    return inst;
}
// A key as the message writes it, quoted so an empty key is visible.
function quoted(s) {
    return '"' + s + '"';
}
function unpref(v) {
    while (true === v.isPref) {
        v = v.peg;
    }
    return v;
}
// Every relative reference in `v` replaced by the field of `node` it
// names. Answers `v` unchanged when it holds none, so a body with no
// substitutions is never needlessly rebuilt -- the identity test
// `fillPlace` already relies on.
function bindNode(v, node, ctx, fail) {
    if (true === v?.isRef && true !== v.absolute) {
        const found = nodeField(v, node);
        if (undefined === found) {
            fail.ref = undefined === fail.ref ? v.canon : fail.ref;
            return v;
        }
        return found.clone(ctx);
    }
    const peg = v?.peg;
    const bound = (0, PlaceVal_1.boundArgStart)(v);
    if (Array.isArray(peg)) {
        let changed = false;
        const out = peg.map((c, cI) => {
            if (true !== c?.isVal || bound <= cI) {
                return c;
            }
            const b = bindNode(c, node, ctx, fail);
            changed = changed || b !== c;
            return b;
        });
        return changed ? (0, PlaceVal_1.rebuild)(v, out, ctx) : v;
    }
    if (true === peg?.isVal) {
        const b = bindNode(peg, node, ctx, fail);
        return b === peg ? v : (0, PlaceVal_1.rebuild)(v, b, ctx);
    }
    if (null != peg && 'object' === typeof peg) {
        let changed = false;
        const out = {};
        for (const k of Object.keys(peg)) {
            const c = peg[k];
            // No isVal guard, for the reason fillPlace gives: a slot holding
            // something that is not a Val answers itself, because the tests
            // above -- is it a reference, has it a peg -- are both false for
            // one.
            const b = bindNode(c, node, ctx, fail);
            changed = changed || b !== c;
            out[k] = b;
        }
        return changed ? (0, PlaceVal_1.rebuild)(v, out, ctx) : v;
    }
    return v;
}
// The field of `node` a reference names, or undefined when it names
// none. Only a chain of plain NAMES is a field: a parent step has no
// answer at a node that is an origin rather than a position, and a
// variable segment is not a name until something resolves it -- both
// are refused here rather than left to resolve somewhere else, which
// is the failure mode the binding exists to remove.
function nodeField(ref, node) {
    let cur = node;
    for (const seg of ref.peg) {
        if ('string' !== typeof seg || '.' === seg) {
            return undefined;
        }
        const peg = cur?.peg;
        if (true !== cur?.isBag || null == peg) {
            return undefined;
        }
        cur = true === cur.isList ? peg[Number(seg)] : peg[seg];
        if (true !== cur?.isVal) {
            return undefined;
        }
    }
    return cur;
}
// A body element that is itself a list splices, which is what makes a
// nested emit compose into one flat sequence.
function splice(v, out) {
    if (true === v?.isList) {
        for (const el of v.peg) {
            splice(el, out);
        }
        return;
    }
    out.push(v);
}
class EmitFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isEmitFunc = true;
        // THE STAGING RULE (G8 phase 0, see AontuContext.settle). The
        // selection is not settled merely by being `done` once -- a sibling
        // conjunct, an include or a spread can still merge nodes into it,
        // and pieces emitted from the half-merged bag would be missing.
        this.staged = true;
    }
    funcname() {
        return 'emit';
    }
    // NEITHER ARGUMENT IS DRIVEN BY THE BASE. The selection is driven by
    // hand below; the TABLE is not driven at all, because a body is a
    // template and driving it would resolve its references at the call
    // site -- the one position a body is never used at.
    prepare(_ctx, _args) {
        return null;
    }
    unify(peer, ctx) {
        // ONE argument is driven: the selection. The table holds bodies,
        // which are templates (see prepare above).
        if (!this.stagedReady(peer, ctx, 1)) {
            return this.residuate(peer, ctx);
        }
        return super.unify(peer, ctx);
    }
    resolve(ctx, args) {
        const nodes = (0, EachFuncVal_1.dataValues)(args?.[0], ctx);
        if ('string' === typeof nodes) {
            // dataValues names the each_data code; emit answers for itself.
            return (0, err_1.makeNilErr)(ctx, 'emit_data', this);
        }
        // A NAMED TABLE IS REACHED BY REFERENCE, and the reference -- not
        // the table -- is what is followed. Followed HERE rather than in
        // the staged drive, which waits for a SETTLED target: a table is a
        // template, a template holding a hole never settles, and waiting
        // for one would mean the dispatch never fires.
        let table = args?.[1];
        if (true === table?.isRef) {
            table = table.unify((0, top_1.top)(), ctx);
        }
        const templates = tableTemplates(table);
        if (isRefusal(templates)) {
            return this.refuse(ctx, templates);
        }
        const peg = [];
        for (const node of nodes) {
            const tmpl = this.dispatch(ctx, node, templates);
            if ('string' === typeof tmpl) {
                return (0, err_1.makeNilErr)(ctx, 'emit_none', this, undefined, 'resolve', {
                    value: node.canon,
                    tried: tmpl,
                });
            }
            const fail = {};
            this.instantiate(ctx, node, tmpl, peg, fail);
            if (undefined !== fail.ref) {
                return (0, err_1.makeNilErr)(ctx, 'emit_ref', this, undefined, 'resolve', {
                    ref: fail.ref,
                    value: node.canon,
                });
            }
            if (undefined !== fail.code) {
                return this.refuse(ctx, { code: fail.code, details: fail.details });
            }
        }
        // THE PIECES ARE PATHED WHERE THEY LAND, once the splicing has
        // settled how many there are. A piece keeps no trace of the body
        // it was written in: the body is a template, and a template's
        // parse position is the one place it is never used.
        for (let i = 0; i < peg.length; i++) {
            (0, Val_1.repathInstance)(peg[i], [...ctx.path, String(i)]);
        }
        return new ListVal_1.ListVal({ peg }, ctx);
    }
    // The located error for a refusal, with the message's details when
    // the refusal carries them.
    refuse(ctx, r) {
        return undefined === r.details ? (0, err_1.makeNilErr)(ctx, r.code, this)
            : (0, err_1.makeNilErr)(ctx, r.code, this, undefined, 'resolve', r.details);
    }
    // First match wins, in table order, by unifiability -- the same
    // question `match` and `filter` ask, answered the same way. Returns
    // the patterns tried when nothing matched, for the located error.
    dispatch(ctx, node, templates) {
        const tried = [];
        for (const tmpl of templates) {
            tried.push(tmpl.match.canon);
            // The trial is against CLONES: `unite` refines a bag in place
            // against a TOP peer, and a pattern that failed must be untouched
            // for the next node.
            if (undefined !== (0, FuncBaseVal_1.trialUnify)(ctx, node.clone(ctx), tmpl.match.clone(ctx))) {
                return tmpl;
            }
        }
        return tried.join(' ');
    }
    // The replacement pairs for one node: the template's `replace` map
    // instantiated at the node -- bound, filled and driven as a body is
    // -- each value as text by the one number-to-text rule (`plusText`,
    // the rule `+` and `join` share), escaped by the template's
    // convention unless that is `none`, and sorted longest key first so
    // the scan takes the longest match at every position (D3's first
    // rule). A value that is not text, or has not settled, is
    // replace_value.
    replacements(ctx, node, tmpl, fail) {
        if (undefined === tmpl.replace) {
            return undefined;
        }
        let inst = tmpl.replace.clone(ctx, { dup: true });
        inst = (0, PlaceVal_1.fillPlace)(bindNode(inst, node, ctx, fail), node, ctx);
        if (!inst.done) {
            inst = (0, unify_1.unite)(ctx, inst, (0, top_1.top)(), 'emit');
        }
        const pairs = [];
        for (const key of Object.keys(inst.peg)) {
            const v = unpref(inst.peg[key]);
            const text = (0, PlusOpVal_1.plusText)(v);
            if (undefined === text) {
                fail.code = 'replace_value';
                fail.details = { key: quoted(key), value: String(v?.canon) };
                return undefined;
            }
            pairs.push([key, 'none' === tmpl.esc ? text : (0, escape_1.escapeText)(text, tmpl.esc)]);
        }
        pairs.sort((a, b) => b[0].length - a[0].length || (0, keyorder_1.cmpCodePoint)(a[0], b[0]));
        return pairs;
    }
    // Instantiate one body at the node and SPLICE its pieces into the
    // output. A full instance to the leaves (`dup`, ADR-005), because a
    // bare clone shares the inner structure of any call in the body and
    // the first node's resolution would answer for every node; the
    // template's replacements written into the instance's literal text;
    // then the two bindings, relative references and the hole, both to
    // the node.
    instantiate(ctx, node, tmpl, out, fail) {
        const pairs = this.replacements(ctx, node, tmpl, fail);
        if (undefined !== fail.code) {
            return;
        }
        const elems = tmpl.body.peg;
        for (let i = 0; i < elems.length; i++) {
            const elctx = ctx.descend(String(out.length));
            let inst = elems[i].clone(elctx, { dup: true });
            if (undefined !== pairs) {
                inst = substituted(inst, i, tmpl.lits, pairs, elctx);
            }
            let piece = (0, PlaceVal_1.fillPlace)(bindNode(inst, node, elctx, fail), node, elctx);
            // A NESTED DISPATCH IS DRIVEN HERE, not left for the next pass.
            // Its selection is bound and the model has settled, so it has
            // everything it needs -- and it must answer NOW, because what
            // makes the result flat is splicing its pieces into this one.
            // Left standing, a nested `emit` resolved a pass later, as a
            // list INSIDE the list, and the fragment algebra is flat.
            // Through `unite` rather than by hand: a rule set that walks
            // into itself for ever is charged to the depth budget and
            // refused as `unify_cycle`, like any other runaway descent.
            if (!piece.done) {
                piece = (0, unify_1.unite)(elctx, piece, (0, top_1.top)(), 'emit');
            }
            splice(piece, out);
        }
    }
} /* node:coverage ignore next 6 */
exports.EmitFuncVal = EmitFuncVal;
//# sourceMappingURL=EmitFuncVal.js.map