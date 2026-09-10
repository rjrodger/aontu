"use strict";
/* Copyright (c) 2026 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NomFuncVal = exports.NOM_STYLES = void 0;
const err_1 = require("../err");
const lower_1 = require("../lower");
const MapVal_1 = require("./MapVal");
const StringVal_1 = require("./StringVal");
const FuncBaseVal_1 = require("./FuncBaseVal");
// The styles, and the map's keys. The first five are `caseName`'s --
// `aontu:profile`'s `%case` vocabulary, shared with the renderer --
// and the last four are nom's own (see the note above). `as-is` is
// not among them: it is the profile's way of saying "do nothing",
// which is not a spelling anyone asks a namer for.
const NOM_STYLES = [
    'camel', // userId
    'dot', // user.id
    'kebab', // user-id
    'pascal', // UserId
    'path', // user/id
    'snake', // user_id
    'text', // User id
    'title', // User Id
    'upper', // USER_ID
];
exports.NOM_STYLES = NOM_STYLES;
// nom's style name -> the `%case` style `caseName` serves. `upper` and
// `text` are nom's spellings: `screaming` is what `aontu:profile` calls
// SCREAMING_SNAKE and that name is pinned cross-port, so the mapping
// lives here rather than in the shared vocabulary.
const CASENAME_STYLES = {
    camel: 'camel',
    kebab: 'kebab',
    pascal: 'pascal',
    snake: 'snake',
    upper: 'screaming',
};
// One name in one style, or undefined when the style is not one, or
// when the name holds no words at all.
function styleName(name, style, acronyms) {
    // `.` and `/` are nom's separators, folded before the shared
    // splitter is asked (see the note above). Everything else that is
    // not a separator is word content: a `$` or a `@` rides into the
    // word it sits in, which is why `nom` renames a spelled path's
    // text and does not tidy it.
    const src = name.replace(/[./]/g, '_');
    // A NAME WITH NO WORDS IS NOT A NAME, and it is refused in every
    // style. `caseName` answers its INPUT for one (it is lowering a
    // declaration, where the name has already been vetted), so
    // `nom("_", pascal)` came back as `"_"` while `nom("_")`
    // refused -- the same argument, accepted by one spelling of the
    // call and refused by the other.
    const words = (0, lower_1.splitWords)(src);
    if (0 === words.length) {
        return undefined;
    }
    const cased = CASENAME_STYLES[style];
    if (undefined !== cased) {
        return (0, lower_1.caseName)(src, cased, acronyms);
    }
    if ('dot' === style) {
        return words.map(lower_1.lowerASCII).join('.');
    }
    if ('path' === style) {
        return words.map(lower_1.lowerASCII).join('/');
    }
    if ('title' === style) {
        return words.map((w) => (0, lower_1.capitalise)(w, acronyms)).join(' ');
    }
    if ('text' === style) {
        // Sentence case: the first word capitalised, the rest lower --
        // EXCEPT an acronym, which stays one, because `ledger id` loses
        // what `ID` was. Membership in the set decides that, not how the
        // input happened to spell the word: asking whether `capitalise`
        // changed it made `nom("ledgerId", text, [ID])` answer
        // `Ledger id` while `nom("ledgerID", text, [ID])` answered
        // `Ledger ID` -- the same name, two answers, decided by its
        // source spelling, which is the one thing a namer must not do.
        const isAcronym = (w) => acronyms.some((a) => (0, lower_1.lowerASCII)(a) === (0, lower_1.lowerASCII)(w));
        return [(0, lower_1.capitalise)(words[0], acronyms)]
            .concat(words.slice(1).map((w) => isAcronym(w) ? (0, lower_1.capitalise)(w, acronyms) : (0, lower_1.lowerASCII)(w)))
            .join(' ');
    }
    return undefined;
}
// The text a value carries, when it is a concrete string. A path is a
// string too (ScalarKindVal's Path sits under String), so a spelled
// address may be renamed like any other text.
function textOf(v) {
    const s = v;
    return (true === s?.isScalar && 'string' === typeof s.peg) ? s.peg : undefined;
}
// An acronym set: a list of concrete strings, or undefined when the
// value is not one.
function acronymsOf(v) {
    const l = v;
    if (true !== l?.isList) {
        return undefined;
    }
    const out = [];
    for (const el of l.peg) {
        const t = textOf(el);
        if (undefined === t || '' === t) {
            return undefined;
        }
        out.push(t);
    }
    return out;
}
class NomFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isNamerFunc = true;
    }
    make(_ctx, spec) {
        return new NomFuncVal(spec);
    }
    funcname() {
        return 'nom';
    }
    resolve(ctx, args) {
        if (args.length < 1 || 3 < args.length) {
            return (0, err_1.makeNilErr)(ctx, 'invalid-arg', this, undefined, 'arity');
        }
        const name = textOf(args[0]);
        if (undefined === name || '' === name) {
            return (0, err_1.makeNilErr)(ctx, 'invalid-arg', this, args[0], 'name');
        }
        // THE SECOND ARGUMENT SAYS WHICH OF THE FOUR CALLS THIS IS, by
        // its shape rather than by its position: a STRING is the style, a
        // LIST is the acronym set. The same rule the component primitives
        // read their spec by, and it is what keeps the acronym set
        // reachable from the map form without a placeholder argument.
        let style;
        let acronyms = [];
        if (2 <= args.length) {
            const second = args[1];
            if (true === second?.isList) {
                if (3 === args.length) {
                    return (0, err_1.makeNilErr)(ctx, 'invalid-arg', this, args[2], 'arity');
                }
                const acr = acronymsOf(second);
                if (undefined === acr) {
                    return (0, err_1.makeNilErr)(ctx, 'invalid-arg', this, second, 'acronyms');
                }
                acronyms = acr;
            }
            else {
                style = textOf(second);
                if (undefined === style) {
                    return (0, err_1.makeNilErr)(ctx, 'invalid-arg', this, second, 'style');
                }
                if (3 === args.length) {
                    const acr = acronymsOf(args[2]);
                    if (undefined === acr) {
                        return (0, err_1.makeNilErr)(ctx, 'invalid-arg', this, args[2], 'acronyms');
                    }
                    acronyms = acr;
                }
            }
        }
        // One style: the string.
        if (undefined !== style) {
            const out = styleName(name, style, acronyms);
            if (undefined === out) {
                return (0, err_1.makeNilErr)(ctx, 'invalid-arg', this, args[1], 'style');
            }
            return this.place(new StringVal_1.StringVal({ peg: out }, ctx));
        }
        // Every style: the map. Closed, because the nine keys ARE the
        // vocabulary and a tenth is a typo -- `nom($.n).pascel` is
        // refused where every other mistake in an aontu document is.
        const peg = {};
        for (const s of NOM_STYLES) {
            const out = styleName(name, s, acronyms);
            if (undefined === out) {
                return (0, err_1.makeNilErr)(ctx, 'invalid-arg', this, args[0], 'name');
            }
            peg[s] = new StringVal_1.StringVal({ peg: out }, ctx);
        }
        const map = new MapVal_1.MapVal({ peg }, ctx);
        map.closed = true;
        return this.place(map);
    }
} /* node:coverage ignore next 6 */
exports.NomFuncVal = NomFuncVal;
//# sourceMappingURL=NomFuncVal.js.map