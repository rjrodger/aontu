"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOW_AT = void 0;
exports.allow = allow;
// THE ROLE GATE: may an agent operating under a ROLE modify a SUBTREE?
//
// An agent about to change a model (`aontu set`, an overlay, a rewrite)
// asks first, and the answer comes from a ROLE MODEL that is itself an
// aontu document: one entry per role, each naming the subtrees the
// role may modify and, optionally, the ones it may not. Roles are
// arbitrary identifier strings -- `admin`, `dev`, `product`, `qa` --
// and the model is whatever its author writes, so the rules of the
// language (spreads, references, includes, `close()`) compose role
// models the way they compose everything else.
//
// The shape of a role is aontu too. It is conjoined with the model at
// evaluation, as a spread template over the roles map:
//
//   roles: { &: { allow: [&: Entry] deny?: [&: Entry] } }
//   Entry = string & re("^[$]") & re("[^.]$")
//
// so a malformed role -- `allow: "$.a"`, `deny: [1]`, an entry that is
// empty or does not start at the root or ends in a dot, a roles map
// that is a number -- is refused by the engine with the engine's own
// code and site, and this module never invents a finding shape of its
// own. The shape is a VALUE the model meets, not text appended to it:
// a model whose last line is an unclosed map or a dangling key would
// swallow appended text, and the shape would then apply to nothing.
// A role with no `allow` list allows nothing, because the template's
// empty list is what the tree holds for it.
//
// The lists are read from the WRITTEN tree, not from the generated
// document: a `hide()` mark keeps a list out of the output, and a gate
// that read the output would let a hidden `deny` vanish -- the wrong
// direction to be wrong in. Each entry must still be one concrete
// string: a kind (`string`) or anything else that does not generate is
// refused with the engine's `no_gen`.
//
// The rule is deliberately small, and it errs towards refusal:
//
//   - A path is ALLOWED when some `allow` entry is an ancestor of it or
//     equal to it. Being allowed `$.services` allows `$.services.auth`
//     and `$.services.auth.replicas`; it does not allow `$` -- a change
//     at the root reaches every sibling too.
//   - A path is REFUSED when any `deny` entry INTERSECTS it: an
//     ancestor, itself, or a descendant. Denied `$.services.*.tier`
//     refuses `$.services.auth.tier` (the denied node), and it refuses
//     `$.services.auth` and `$.services` too, because a change at
//     either could rewrite the tier. Deny wins over allow whatever the
//     order the entries were written in.
//   - `*` in an entry matches exactly one segment, any key. It is the
//     only pattern character; everything else is a key or a list index
//     compared for equality, as a reference compares them.
//   - A role is ONE KEY of the roles map, looked up as written, and a
//     role the map does not declare may modify nothing.
//
// The answer names the entry that decided it, as a path INTO THE ROLE
// MODEL (`$.roles.dev.deny.0`), so `aontu why` can say who wrote the
// rule and where.
const aontu_1 = require("./aontu");
const ConjunctVal_1 = require("./val/ConjunctVal");
const vet_1 = require("./vet");
const query_1 = require("./query");
const utility_1 = require("./utility");
// Where the roles map lives when the caller does not say.
exports.ALLOW_AT = '$.roles';
// One entry: a string that starts at the root and does not end in a
// dot. `re()` refuses a nested quantifier, so the two conditions are
// two patterns rather than one grammar; an empty segment in the middle
// is harmless, because the path split drops it as a reference does.
const ENTRY = 'string & re("^[$]") & re("[^.]$")';
// The shape every role must satisfy, in the language: a list of
// subtree entries to allow, and optionally one to deny.
const ROLE_SHAPE = `{ allow: [&: ${ENTRY}] deny?: [&: ${ENTRY}] }`;
// The shape document: a spread over the roles map at `at`, or -- when
// the roles map IS the document -- a top-level spread. Keys are quoted
// the way `aontu set` quotes an overlay line, so a segment may be a
// word the grammar spells otherwise.
function shapeSource(at) {
    const keys = (0, query_1.pathParts)(at).map((p) => JSON.stringify(p));
    return 0 === keys.length
        ? '&: ' + ROLE_SHAPE
        : keys.join(': ') + ': { &: ' + ROLE_SHAPE + ' }';
}
// `$.a.b` for a segment list, `$` for none: the spelling every report
// uses for a path, whatever the caller wrote.
function pathText(parts) {
    return '$' + (0 < parts.length ? '.' + parts.join('.') : '');
}
// The finding shape `get` reports with, deliberately: the gate invents
// no error format of its own.
function finding(code, path, message, note) {
    return {
        code,
        class: 'reference',
        severity: 'error',
        path,
        message,
        sites: [],
        ...(null == note ? {} : { note }),
    };
}
// The entries of one list of the role, read from the tree. A concrete
// string is taken as written, hidden or not; anything else is asked
// to generate, which is where a kind or a hidden kind fails with the
// engine's own code, and where a preference answers with its default.
function readEntries(list, by, ctx) {
    const entries = [];
    for (let i = 0; i < list.peg.length; i++) {
        const el = list.peg[i];
        const before = ctx.err.length;
        const text = true === el.isString ? el.peg : el.gen(ctx);
        if (before < ctx.err.length) {
            const err = ctx.err[before];
            return { entries, finding: finding(err.why, `${by}.${i}`, err.msg) };
        }
        entries.push({ parts: (0, query_1.pathParts)(text), text, by: `${by}.${i}` });
    }
    return { entries };
}
// One segment of an entry against one segment of a path: `*` matches
// any key, anything else matches itself.
function segmentMatches(pattern, segment) {
    return '*' === pattern || pattern === segment;
}
// The two subtrees share a node: one is an ancestor of the other, or
// they are the same. Checked over the shorter of the two, because the
// longer one only says where inside the shared subtree it goes on.
function intersects(entry, path) {
    const n = Math.min(entry.length, path.length);
    for (let i = 0; i < n; i++) {
        if (!segmentMatches(entry[i], path[i])) {
            return false;
        }
    }
    return true;
}
// The entry is an ancestor of the path, or the path itself. A longer
// entry names something INSIDE the asked subtree, and a change to the
// subtree reaches its siblings, so it does not cover.
function covers(entry, path) {
    return entry.length <= path.length && intersects(entry, path);
}
function decide(asked, allows, denies) {
    const parts = (0, query_1.pathParts)(asked);
    const path = pathText(parts);
    // Deny first, and any intersection refuses: an entry above the path
    // forbids the whole subtree it is in, and one below it forbids the
    // change that would rewrite it from above.
    for (const d of denies) {
        if (intersects(d.parts, parts)) {
            return { path, allowed: false, reason: 'deny', by: d.by, pattern: d.text };
        }
    }
    for (const a of allows) {
        if (covers(a.parts, parts)) {
            return { path, allowed: true, reason: 'allow', by: a.by, pattern: a.text };
        }
    }
    return { path, allowed: false, reason: 'uncovered' };
}
function errorReport(role, f) {
    return { verdict: 'error', role, paths: [], findings: [f] };
}
// Evaluate the role model, select the role, and decide every path.
function allow(src, role, paths, opts) {
    const options = opts ?? {};
    const at = pathText((0, query_1.pathParts)(options.at ?? exports.ALLOW_AT));
    const aontu = new aontu_1.Aontu((0, utility_1.includeOpts)(options));
    const ctx = aontu.ctx({ collect: true });
    const parseOpts = null == options.path ? undefined : { path: options.path };
    // The model MEETS the shape as data meets a schema under vet: both
    // parsed, conjoined, and unified ONCE. A parsed tree is single-use,
    // and a model evaluated on its own and then met again has already
    // resolved its references against itself, so a registry written
    // `roles: close({ &: $.Role ... })` would fail its second pass with
    // a `$.Role` it cannot find. The shape is parsed FIRST: the context
    // takes the last parsed document as its root and as the text an
    // error frame excerpts, and both must be the model's.
    const shape = aontu.parse(shapeSource(at), undefined, ctx);
    const model = aontu.parse(src, parseOpts, ctx);
    if (0 < ctx.err.length) {
        return errorReport(role, (0, query_1.evalFailure)(ctx));
    }
    const root = aontu.unify(new ConjunctVal_1.ConjunctVal({ peg: [model, shape] }, ctx), undefined, ctx);
    if (0 < ctx.err.length || true === root.isNil) {
        return errorReport(role, (0, query_1.evalFailure)(ctx));
    }
    // The shape made the roles map exist, so what can be missing is the
    // ROLE -- and an undeclared role may modify nothing. That is the
    // question's answer (refused), not a broken model (error), and the
    // finding carries the nearest declared name. The role is one key,
    // looked up as written: not a path, so a name may hold a dot, and
    // an own key only, so a name the prototype has is not a role.
    const roles = (0, vet_1.anchorAt)(root, at);
    const atRole = `${at}.${role}`;
    if (!Object.prototype.hasOwnProperty.call(roles.peg, role)) {
        const near = (0, query_1.nearestKey)(role, Object.keys(roles.peg));
        return {
            verdict: 'refused',
            role,
            paths: paths.map((p) => ({
                path: pathText((0, query_1.pathParts)(p)), allowed: false, reason: 'no_role',
            })),
            findings: [finding('no_path', atRole, `The role ${role} is not declared at ${at} in this document.`, null == near ? undefined : `did you mean ${near}?`)],
        };
    }
    const node = roles.peg[role];
    const allows = readEntries(node.peg.allow, `${atRole}.allow`, ctx);
    if (null != allows.finding) {
        return errorReport(role, allows.finding);
    }
    const denies = readEntries(node.peg.deny, `${atRole}.deny`, ctx);
    if (null != denies.finding) {
        return errorReport(role, denies.finding);
    }
    const decisions = paths.map((p) => decide(p, allows.entries, denies.entries));
    // Nothing asked is nothing allowed: a gate that answered `allowed`
    // to an empty question would let a caller that dropped its
    // arguments through.
    const allowed = 0 < decisions.length && decisions.every((d) => d.allowed);
    return {
        verdict: allowed ? 'allowed' : 'refused',
        role,
        paths: decisions,
        findings: [],
    };
}
//# sourceMappingURL=allow.js.map