"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.render = render;
exports.renderProfile = renderProfile;
exports.renderValue = renderValue;
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
function render(src, options) {
    const opts = options ?? {};
    const aontu = new aontu_1.Aontu((0, utility_1.includeOpts)(opts));
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
    const value = (0, hcanon_1.hcanon)(node);
    const report = (0, vet_1.vet)(VOCABULARY, value);
    if ('valid' !== report.verdict) {
        return errorReport(report.findings);
    }
    const codeVal = node.peg.aontu?.peg?.Code;
    const instance = new aontu_1.Aontu().generate(VOCABULARY + (undefined === codeVal ? '' : '\naontu: Code: ' + (0, hcanon_1.hcanon)(codeVal)));
    const folded = renderValue(instance, opts);
    if (rec && 'error' !== folded.verdict) {
        const marks = emitted(node);
        const trace = traceOf(marks, instance, folded.units);
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
function traceOf(marks, instance, units) {
    const pre = [];
    unitList(instance).forEach((u, i) => {
        if (units.some((r) => r.path === u.path)) {
            pre.push({ at: '$.aontu.Code.units.' + i, path: u.path });
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
            const a = '$.aontu.Code.units.' + i + '.decls.' + j;
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
        bundled[lang] = new aontu_1.Aontu().generate('@"aontu:lang/' + lang + '"').aontu.Profile;
    }
    return bundled[lang];
}
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
    const instance = new aontu_1.Aontu().generate(PROFILE_VOCABULARY + '\naontu: Profile: ' +
        (0, hcanon_1.hcanon)(root.peg.aontu.peg.Profile));
    return { profile: instance.aontu.Profile };
}
// The instance's unit list, or none: `code` is the vocabulary's own
// key and is always there, `units` is not. One reader, so the fold,
// the trace and the coverage report all see the same list.
function unitList(instance) {
    return Array.isArray(instance?.aontu?.Code?.units) ?
        instance.aontu.Code.units : [];
}
function renderValue(instance, options) {
    const opts = options ?? {};
    const errors = [];
    const lossy = [];
    const units = [];
    const list = unitList(instance);
    const seen = [];
    let selected = 0;
    list.forEach((unit, i) => {
        const upath = '$.aontu.Code.units.' + i;
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
        const family = profile.lowering;
        const ctx = undefined === family ? undefined
            : { profile, family, unit: path, lossy };
        let text = '';
        if (undefined !== ctx) {
            const header = (0, lower_1.lowerHeader)(unit, instance?.aontu?.Code?.source, ctx);
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
        errors.push(finding('render_unit', 'reference', '$.aontu.Code.units', 'no unit has the path ' + opts.unit + '.'));
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