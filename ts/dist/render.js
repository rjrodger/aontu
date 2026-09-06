"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.render = render;
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
const VOCABULARY = '@"aontu:code"';
const TEXT_PROFILE = '@"aontu:lang/text"';
function finding(code, cls, path, message, note) {
    return {
        code,
        class: cls,
        severity: 'error',
        path,
        message,
        sites: [],
        ...(undefined === note ? {} : { note }),
    };
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
    // COLLECT MODE, so a syntax error arrives on the context rather than
    // as a throw (the jsonschema and vet precedent; no try/catch, for
    // the reason those verbs have none).
    const actx = aontu.ctx({ collect: true });
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
    const report = (0, vet_1.vet)(VOCABULARY, value, (0, utility_1.includeOpts)(opts));
    if ('valid' !== report.verdict) {
        return errorReport(report.findings);
    }
    // The meet, keyed: the vocabulary's root holds `code`, and so does
    // the instance's (a value the vet admitted is a map), and a document
    // with no `code` at all is the vocabulary's own empty instance.
    const codeVal = node.peg.code;
    const instance = new aontu_1.Aontu((0, utility_1.includeOpts)(opts)).generate(VOCABULARY + (undefined === codeVal ? '' : '\ncode: ' + (0, hcanon_1.hcanon)(codeVal)));
    return renderValue(instance, opts);
}
// The bundled text profile, evaluated once: the profile of a unit
// whose declarations are fragments and text escapes only.
let textProfile = undefined;
function bundledText() {
    if (undefined === textProfile) {
        textProfile = new aontu_1.Aontu().generate(TEXT_PROFILE).profile;
    }
    return textProfile;
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
    if ('text' === lang || fragOnly) {
        return bundledText();
    }
    return undefined;
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
function pad(profile, at) {
    return profile.indent.unit.repeat(profile.indent.width * at);
}
function line(profile, at, text) {
    return ('' === text ? '' : pad(profile, at)) + text + '\n';
}
function inline(piece) {
    return 'string' === typeof piece ? piece : piece.name;
}
function foldPiece(piece, profile, unit, path, lossy) {
    if ('string' === typeof piece) {
        return line(profile, 0, piece);
    }
    if ('line' === piece.k) {
        return line(profile, piece.at ?? 0, piece.of.map(inline).join(''));
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
// The fold alone, over `generate()` output: the instance is
// `{code: {units: [...]}}` as the vocabulary shapes it, with its
// defaults filled -- which is what `render` hands over, and what a
// caller of this function is responsible for.
function renderValue(instance, options) {
    const opts = options ?? {};
    const errors = [];
    const lossy = [];
    const units = [];
    const list = Array.isArray(instance?.code?.units) ? instance.code.units : [];
    const seen = [];
    let selected = 0;
    list.forEach((unit, i) => {
        const upath = '$.code.units.' + i;
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
        let text = '';
        decls.forEach((decl, j) => {
            const dpath = upath + '.decls.' + j;
            if ('frag' === decl.k) {
                lossy.push({
                    unit: path, path: dpath, tier: 2, construct: 'frag',
                    reason: 'a fragment says nothing about ' + lang + ' syntax',
                });
                decl.of.forEach((piece, n) => {
                    text += foldPiece(piece, profile, path, dpath + '.of.' + n, lossy);
                });
            }
            else if ('text' === decl.k) {
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
            else {
                errors.push(finding('render_profile', 'parse', dpath + '.k', 'a ' + decl.k + ' declaration has no lowering under the ' +
                    profile.lang + ' profile.'));
            }
        });
        units.push({ path, lang, text });
    });
    if (undefined !== opts.unit && 0 === selected) {
        errors.push(finding('render_unit', 'reference', '$.code.units', 'no unit has the path ' + opts.unit + '.'));
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