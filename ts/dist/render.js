"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.render = render;
exports.renderProfile = renderProfile;
exports.renderValue = renderValue;
// THE RENDERER (docs/design/RENDER.0.md; docs/capability-review/
// g9-transformation.md §3). `render` evaluates a document, takes the
// value at `--at` (the root by default), vets it against the bundled
// `aontu:code` vocabulary, and folds `code.units` into bytes;
// `renderValue` is the fold alone, over `generate()` output. The fold
// is pure and total: it never touches the Val tree, never reads or
// writes a file, never sorts and never iterates a map, and every piece
// of a fragment carries its own depth (`at`), so the renderer owns
// every prefix and no piece nests another (the second amendment's
// fragment algebra, RENDER.0.md D2 and D6).
//
// WHAT THIS PHASE RENDERS (RENDER.0.md P3): fragments -- a line, a
// blank run, a raw block, a bare string piece, a reference inline --
// and the `text` escape, under a profile that knows its language. The
// one bundled profile is `aontu:lang/text`, which every fragment-only
// unit falls back to; a declaration (`record`, `enum`, ...) needs a
// LOWERING, which P5 brings with the TypeScript and Go profiles, and
// until then is `render_profile`.
const aontu_1 = require("./aontu");
const vet_1 = require("./vet");
const hcanon_1 = require("./hcanon");
const err_1 = require("./err");
const keyorder_1 = require("./keyorder");
const utility_1 = require("./utility");
const lower_1 = require("./lower");
const VOCABULARY = '@"aontu:code"';
// The bundled profiles, by lang: aontu:lang/<lang>.
const BUNDLED_LANGS = ['go', 'text', 'typescript'];
const PROFILE_VOCABULARY = '@"aontu:profile"';
function finding(code, cls, path, message) {
    return { code, class: cls, severity: 'error', path, message, sites: [] };
}
function errorReport(errors) {
    return { verdict: 'error', units: [], lossy: [], errors };
}
// The verb's evaluation, before the fold (RENDER.0.md D1): evaluate,
// anchor, vet the anchored value against the vocabulary as `aontu vet`
// would, and generate the MEET of the two -- so the vocabulary's
// defaults (`at: 0`, `n: 1`, `reindent: true`) are in the instance the
// fold reads, whether or not the document included the vocabulary
// itself. THE VET AND THE MEET READ THE SETTLED VALUE, re-sourced
// through its hash form (valid source that evaluates to the same
// value), not the document's text: a fragment's lines are what a
// transform COMPUTED -- an `emit`, a `join` -- and the vocabulary's
// alternatives are tried against values, not against calls that are
// still waiting to fire. A finding from that vet therefore addresses
// the instance by path, which is the addressing every render finding
// uses (G9 §3); a document that does not stand up at all is reported
// with its own sites, before any of this.
function render(src, options) {
    const opts = options ?? {};
    const aontu = new aontu_1.Aontu((0, utility_1.includeOpts)(opts));
    // THE RECORDER (P7), on for a run that was asked for a trace or a
    // coverage report and off for every other. Its presence is the one
    // switch: the read set fills as references resolve, and the two
    // riders that carry a read address and a dispatch stamp are written
    // only while it is there.
    const rec = true === opts.trace || true === opts.coverage;
    const reads = rec ? new Set() : undefined;
    // COLLECT MODE, so a syntax error arrives on the context rather than
    // as a throw (the jsonschema and vet precedent; no try/catch, for
    // the reason those verbs have none).
    const actx = aontu.ctx({ collect: true, reads });
    const root = aontu.unify(src, { path: opts.path, collect: true }, actx);
    if (0 < actx.err.length || true === root?.isNil) {
        return errorReport([(0, vet_1.failureFinding)(actx, opts.path, root)]);
    }
    let node = root;
    if (null != opts.at && '' !== opts.at) {
        const found = (0, vet_1.anchorAt)(root, opts.at);
        if (null == found) {
            // The anchor names nothing: a `no_path` nil through the finding
            // shape every other refusal here uses.
            const nil = (0, err_1.makeNilErr)(actx, 'no_path', root, undefined, 'at');
            actx.err.push(nil);
            return errorReport([(0, vet_1.failureFinding)(actx, opts.path, root)]);
        }
        node = found;
    }
    // UNDER NO CALLER CAPABILITY, here and in the meet below: the
    // vocabulary is the engine's own and the instance is a canon, which
    // includes nothing, so the caller's include capability -- which
    // governs the DOCUMENT -- has nothing to govern here, and `none`
    // must not deny the renderer its own schema.
    const value = (0, hcanon_1.hcanon)(node);
    const report = (0, vet_1.vet)(VOCABULARY, value);
    if ('valid' !== report.verdict) {
        return errorReport(report.findings);
    }
    // The meet, keyed: the vocabulary's root holds `aontu.code`, and so
    // does the instance's (a value the vet admitted is a map), and a
    // document with no `code` at all is the vocabulary's own empty
    // instance. The key is namespaced (ADR-029), so the reach is two deep.
    const codeVal = node.peg.aontu?.peg?.code;
    const instance = new aontu_1.Aontu().generate(VOCABULARY + (undefined === codeVal ? '' : '\naontu: code: ' + (0, hcanon_1.hcanon)(codeVal)));
    const folded = renderValue(instance, opts);
    // THE TWO REPORTS ARE JOINED TO THE FOLD BY PATH (P7), which is what
    // lets the fold stay the pure total function D6 asks for: the
    // dispatch stamps ride the VALUE, the instance the fold reads is
    // that value re-sourced through its hash form, and a piece is at the
    // same path in both. Nothing to report on `error`: there are no
    // units to attribute pieces to.
    if (rec && 'error' !== folded.verdict) {
        const marks = emitted(node);
        const trace = traceOf(marks, instance, folded.units);
        // AN EMPTY TRACE IS NO TRACE, in both ports: Go omits an empty
        // slice, and a report shape that differed by port would be the one
        // thing the shared rows exist to refuse. A run that emitted no
        // piece has nothing to attribute, and the coverage report says so
        // in its own words.
        if (0 < trace.length) {
            folded.trace = trace;
        }
        if (true === opts.coverage) {
            const cov = coverOf(root, node, reads, opts, marks, instance, folded.units);
            if (undefined === cov) {
                const nil = (0, err_1.makeNilErr)(actx, 'no_path', root, undefined, 'coverageAt');
                actx.err.push(nil);
                return errorReport([(0, vet_1.failureFinding)(actx, opts.path, root)]);
            }
            folded.coverage = cov;
        }
    }
    return folded;
}
// ---------------------------------------------------------------------
// THE TRACE AND THE COVERAGE REPORT (RENDER.0.md D11, P7).
// The one walk order both ports walk in: a list by index, a map by key
// in code-point order. `fn` answers whether to descend.
function walkVals(root, fn) {
    const walk = (v, path) => {
        if (null == v || true !== v.isVal || !fn(v, path)) {
            return;
        }
        if (true === v.isList && null != v.peg) {
            for (let i = 0; i < v.peg.length; i++) {
                walk(v.peg[i], [...path, String(i)]);
            }
        }
        else if (true === v.isMap && null != v.peg) {
            for (const k of Object.keys(v.peg).sort(keyorder_1.cmpCodePoint)) {
                // AN ALIAS DECLARATION IS NOT A MEMBER, here for the reason
                // every fold has it (./val/members.ts): `%wire = …` holds a
                // value the document never generates, so it is neither a piece
                // to trace nor model that could be called dead.
                if (!v.aliasKeys.includes(k)) {
                    walk(v.peg[k], [...path, k]);
                }
            }
        }
    };
    walk(root, []);
}
// A path as an address: `$`, then a dot before every segment.
function addr(path) {
    return '$' + path.map((seg) => '.' + seg).join('');
}
// Every piece a dispatch stamped, under the anchored value, in
// document order. The path is relative to the anchor, which is where
// the instance the fold reads is rooted too.
function emitted(node) {
    const out = [];
    walkVals(node, (v, path) => {
        if (null != v.emitted) {
            out.push({ path: addr(path), mark: v.emitted });
        }
        return true;
    });
    return out;
}
// The trace: one entry per stamped piece that a RENDERED unit holds. A
// piece is IN the unit whose path prefixes its own, which is the whole
// of the question -- no path is parsed, and a stamp that lies under no
// unit at all (a rule set held under a key of its own, and referred to
// from a unit) simply matches nothing. A unit the run did not render
// (`--unit` names one) has no bytes for a piece of it to be in, so it
// is not among the prefixes either.
function traceOf(marks, instance, units) {
    const pre = [];
    unitList(instance).forEach((u, i) => {
        if (units.some((r) => r.path === u.path)) {
            pre.push({ at: '$.aontu.code.units.' + i, path: u.path });
        }
    });
    const out = [];
    for (const m of marks) {
        const hit = pre.find((p) => m.path === p.at || m.path.startsWith(p.at + '.'));
        if (undefined === hit) {
            continue;
        }
        out.push({ unit: hit.path, piece: m.path, node: m.mark.node, rule: m.mark.rule });
    }
    return out;
}
// Every proper ancestor of an address, `$` included.
function ancestors(a) {
    const parts = a.split('.');
    const out = [];
    for (let i = 1; i < parts.length; i++) {
        out.push(parts.slice(0, i).join('.'));
    }
    return out;
}
// Is the value at `a` covered by the set -- the address itself in it,
// or an address above it? An address ABOVE it covers the whole subtree:
// a reference that read `$.schema` read everything under it, and a rule
// that emitted a unit emitted every declaration in it.
function covered(set, a) {
    if (set.has(a)) {
        return true;
    }
    for (const up of ancestors(a)) {
        if (set.has(up)) {
            return true;
        }
    }
    return false;
}
// THE COVERAGE REPORT (P7). Dead model is measured over the DOCUMENT
// ROOT, or under `coverageAt` when a document keeps its model under one
// key (X-3, decided here): the read set is absolute, so a narrower
// measure is a narrower walk, not a different origin. The render's own
// output -- the `aontu` namespace under the anchor -- is not model and
// is never walked into: nothing reads it, so every document would
// otherwise report it dead. The whole NAMESPACE is excluded, not just
// `aontu.code` (ADR-029): everything under it is language-supplied, so
// an included vocabulary is not dead model either.
function coverOf(root, node, reads, opts, marks, instance, units) {
    // THE ANCHOR IS THE ONE render() ALREADY FOUND, so the namespace
    // under it is named without asking a second time: `--at` is resolved
    // before the vet, and an anchor that named nothing never reached here.
    const codeAddr = addr(node.path.concat('aontu'));
    let from = root;
    let base = [];
    if (null != opts.coverageAt && '' !== opts.coverageAt) {
        const found = (0, vet_1.anchorAt)(root, opts.coverageAt);
        if (null == found) {
            return undefined;
        }
        from = found;
        base = found.path;
    }
    // The two questions asked of the read set, as sets: is this address
    // read (or under one that is), and does a read lie BELOW it?
    const above = new Set(reads);
    const below = new Set();
    for (const r of reads) {
        for (const up of ancestors(r)) {
            below.add(up);
        }
    }
    const dead = [];
    walkVals(from, (_v, path) => {
        const a = addr(base.concat(path));
        if (a === codeAddr || covered(above, a)) {
            return false;
        }
        // THE ROOT OF THE MEASURE IS NEVER ITSELF DEAD MODEL, and is
        // descended into whatever the read set holds. A document that is
        // only a transform reads nothing above its own model, and naming
        // the root there would report the whole document dead while its
        // one live subtree sat inside it.
        if (below.has(a) || 0 === path.length) {
            return true;
        }
        dead.push(a);
        return false;
    });
    // A SILENT HOLE: a declaration of a rendered unit that no stamp
    // touches -- neither its own, nor one on the unit above it, nor one
    // on a piece inside it.
    const stamped = new Set(marks.map((m) => m.path));
    const inside = new Set();
    for (const m of marks) {
        for (const up of ancestors(m.path)) {
            inside.add(up);
        }
    }
    const unruled = [];
    unitList(instance).forEach((unit, i) => {
        if (!units.some((u) => u.path === unit.path)) {
            return;
        }
        const decls = unit.decls;
        decls.forEach((_d, j) => {
            const a = '$.aontu.code.units.' + i + '.decls.' + j;
            if (!covered(stamped, a) && !inside.has(a)) {
                unruled.push({ unit: unit.path, path: a });
            }
        });
    });
    return { read: [...reads].sort(keyorder_1.cmpCodePoint), dead, unruled };
}
// The bundled text profile, evaluated once: the profile of a unit
// whose declarations are fragments and text escapes only.
const bundled = {};
// A bundled profile, evaluated once: the meet of aontu:lang/<lang>
// with the vocabulary, so its defaults are in it.
function bundledProfile(lang) {
    if (!BUNDLED_LANGS.includes(lang)) {
        return undefined;
    }
    if (undefined === bundled[lang]) {
        bundled[lang] = new aontu_1.Aontu().generate('@"aontu:lang/' + lang + '"').aontu.profile;
    }
    return bundled[lang];
}
// PROFILE SELECTION, per unit (RENDER.0.md D5): a caller-supplied
// profile whose `lang` is the unit's; else the bundled profile of that
// `lang`; else `aontu:lang/text`, if and only if every declaration in
// the unit is a fragment or a text escape; else nothing, which the
// caller reports as `render_profile`. The unit's inline `profile` is
// merged over whichever base was found.
function profileFor(lang, given, fragOnly) {
    const supplied = (given ?? []).find((p) => p?.lang === lang);
    if (undefined !== supplied) {
        return supplied;
    }
    const own = bundledProfile(lang);
    if (undefined !== own) {
        return own;
    }
    return fragOnly ? bundledProfile('text') : undefined;
}
function isMap(v) {
    return null != v && 'object' === typeof v && !Array.isArray(v);
}
// An inline profile merged over its base, map by map, the inline
// value winning at a leaf; keys in code-point order, so the merge is
// the same in both ports.
function mergeProfile(base, over) {
    const out = { ...base };
    for (const k of Object.keys(over).sort(keyorder_1.cmpCodePoint)) {
        out[k] = isMap(base[k]) && isMap(over[k]) ?
            mergeProfile(base[k], over[k]) : over[k];
    }
    return out;
}
// THE FOLD (RENDER.0.md D6). `pad(at)` is `indent.unit` repeated
// `indent.width × at` times; a line is `pad + text + LF`, and an empty
// text emits no pad; a blank is its terminators alone; a raw block's
// lines each get the pad unless `reindent: false`, which emits them
// at column 0 verbatim -- and common leading indentation is never
// stripped. A reference inline is its name, verbatim (a
// declaration-capable profile puts it through its identifier rules,
// P5). Nothing is trimmed (D3): the text is the transform's.
// A profile with no indent -- a caller-supplied map the vocabulary
// never filled -- takes the vocabulary's own default, two spaces.
function pad(profile, at) {
    const indent = profile.indent ?? { unit: ' ', width: 2 };
    return (indent.unit ?? ' ').repeat((indent.width ?? 2) * at);
}
function line(profile, at, text) {
    return ('' === text ? '' : pad(profile, at)) + text + '\n';
}
// A reference inline is its name: through the profile's identifier
// rules under a lowering, verbatim under text.
function inline(piece, ctx) {
    if ('string' === typeof piece) {
        return piece;
    }
    return undefined === ctx ? piece.name : (0, lower_1.ident)(piece.name, 'record', ctx, '', false);
}
function foldPiece(piece, profile, unit, path, lossy, ctx) {
    if ('string' === typeof piece) {
        return line(profile, 0, piece);
    }
    if ('line' === piece.k) {
        return line(profile, piece.at ?? 0, piece.of.map((p) => inline(p, ctx)).join(''));
    }
    if ('blank' === piece.k) {
        return '\n'.repeat(piece.n ?? 1);
    }
    lossy.push({
        unit, path, tier: 3, construct: 'raw',
        reason: 'verbatim text: the renderer re-indents it and checks nothing else',
    });
    const at = piece.at ?? 0;
    const reindent = piece.reindent ?? true;
    const lines = piece.text.split('\n');
    if ('' === lines[lines.length - 1]) {
        lines.pop();
    }
    return lines.map((l) => reindent ? line(profile, at, l) : l + '\n').join('');
}
// A PROFILE DOCUMENT (RENDER.0.md D5), evaluated the way `render`
// evaluates its own: under the caller's include options, then vetted
// against aontu:profile as a settled value and met with that vocabulary
// so its defaults (`indent.width: 2`, ...) are in it. The answer is the
// `profile` map the fold reads -- what `--profile <file>` hands to
// RenderOptions.profiles -- or the findings that refused the document:
// one that does not stand up, or one the vocabulary rejects.
function renderProfile(src, options) {
    const opts = options ?? {};
    const aontu = new aontu_1.Aontu((0, utility_1.includeOpts)(opts));
    const actx = aontu.ctx({ collect: true });
    const root = aontu.unify(src, { path: opts.path, collect: true }, actx);
    if (0 < actx.err.length || true === root?.isNil) {
        return { errors: [(0, vet_1.failureFinding)(actx, opts.path, root)] };
    }
    const report = (0, vet_1.vet)(PROFILE_VOCABULARY, (0, hcanon_1.hcanon)(root));
    if ('valid' !== report.verdict) {
        return { errors: report.findings };
    }
    // The meet, keyed as render's is: the vocabulary requires `profile`,
    // so a value the vet admitted has one.
    const instance = new aontu_1.Aontu().generate(PROFILE_VOCABULARY + '\naontu: profile: ' +
        (0, hcanon_1.hcanon)(root.peg.aontu.peg.profile));
    return { profile: instance.aontu.profile };
}
// The instance's unit list, or none: `code` is the vocabulary's own
// key and is always there, `units` is not. One reader, so the fold,
// the trace and the coverage report all see the same list.
function unitList(instance) {
    return Array.isArray(instance?.aontu?.code?.units) ?
        instance.aontu.code.units : [];
}
// The fold alone, over `generate()` output: the instance is
// `{code: {units: [...]}}` as the vocabulary shapes it, with its
// defaults filled -- which is what `render` hands over, and what a
// caller of this function is responsible for.
function renderValue(instance, options) {
    const opts = options ?? {};
    const errors = [];
    const lossy = [];
    const units = [];
    const list = unitList(instance);
    const seen = [];
    let selected = 0;
    list.forEach((unit, i) => {
        const upath = '$.aontu.code.units.' + i;
        const path = unit.path;
        const lang = unit.lang;
        // A UNIT PATH IS RELATIVE, DESCENDS, AND IS ITS OWN (RENDER.0.md
        // D8): an absolute path, a `..` segment or a repeat of another
        // unit's path is refused before anything is written.
        if (path.startsWith('/')) {
            errors.push(finding('render_path', 'parse', upath + '.path', 'the unit path ' + path + ' is absolute.'));
            return;
        }
        if (path.split('/').includes('..')) {
            errors.push(finding('render_path', 'parse', upath + '.path', 'the unit path ' + path + ' climbs out of the output directory.'));
            return;
        }
        if (seen.includes(path)) {
            errors.push(finding('render_path', 'parse', upath + '.path', 'the unit path ' + path + ' repeats another unit\'s.'));
            return;
        }
        seen.push(path);
        if (undefined !== opts.unit && opts.unit !== path) {
            return;
        }
        selected++;
        const decls = unit.decls;
        const fragOnly = decls.every((d) => 'frag' === d.k || 'text' === d.k);
        const base = profileFor(lang, opts.profiles, fragOnly);
        if (undefined === base) {
            errors.push(finding('render_profile', 'parse', upath + '.lang', 'no profile renders ' + lang + ': a declaration needs a lowering, and ' +
                'only fragments and text escapes render under aontu:lang/text.'));
            return;
        }
        const profile = null == unit.profile ? base : mergeProfile(base, unit.profile);
        // THE LOWERING (D5, P5), when the profile names one: the unit's
        // header -- banner, package clause, imports -- and each declaration
        // as pieces the fold takes, a blank line between two lowered
        // declarations. A fragment or a text escape owns its own blanks.
        const family = profile.lowering;
        const ctx = undefined === family ? undefined
            : { profile, family, unit: path, lossy };
        let text = '';
        if (undefined !== ctx) {
            const header = (0, lower_1.lowerHeader)(unit, instance?.aontu?.code?.source, ctx);
            for (const piece of header) {
                text += foldPiece(piece, profile, path, upath, lossy, ctx);
            }
            if (0 < header.length && 0 < decls.length) {
                text += '\n';
            }
        }
        let lowered = false;
        decls.forEach((decl, j) => {
            const dpath = upath + '.decls.' + j;
            if ('frag' === decl.k) {
                lowered = false;
                lossy.push({
                    unit: path, path: dpath, tier: 2, construct: 'frag',
                    reason: 'a fragment says nothing about ' + lang + ' syntax',
                });
                decl.of.forEach((piece, n) => {
                    text += foldPiece(piece, profile, path, dpath + '.of.' + n, lossy, ctx);
                });
            }
            else if ('text' === decl.k) {
                lowered = false;
                if (decl.lang !== lang) {
                    errors.push(finding('render_lang', 'conflict', dpath + '.lang', 'the text escape is ' + decl.lang + ' in a ' + lang + ' unit.'));
                    return;
                }
                lossy.push({
                    unit: path, path: dpath, tier: 3, construct: 'text',
                    reason: 'verbatim ' + lang + ': the renderer checks nothing in it',
                });
                text += decl.text;
            }
            else if (undefined !== ctx) {
                if (lowered) {
                    text += '\n';
                }
                for (const piece of (0, lower_1.lowerDecl)(decl, dpath, ctx)) {
                    text += foldPiece(piece, profile, path, dpath, lossy, ctx);
                }
                lowered = true;
            }
            else {
                errors.push(finding('render_profile', 'parse', dpath + '.k', 'a ' + decl.k + ' declaration has no lowering under the ' +
                    profile.lang + ' profile.'));
            }
        });
        units.push({ path, lang, text });
    });
    if (undefined !== opts.unit && 0 === selected) {
        errors.push(finding('render_unit', 'reference', '$.aontu.code.units', 'no unit has the path ' + opts.unit + '.'));
    }
    if (true === opts.strict) {
        for (const loss of lossy) {
            if (3 === loss.tier) {
                errors.push(finding('render_strict', 'conflict', loss.path, 'the ' + loss.construct + ' in ' + loss.unit +
                    ' is an opaque escape, refused under strict.'));
            }
        }
    }
    if (0 < errors.length) {
        return errorReport(errors);
    }
    return {
        verdict: 0 < lossy.length ? 'lossy' : 'ok',
        units,
        lossy,
    };
}
//# sourceMappingURL=render.js.map