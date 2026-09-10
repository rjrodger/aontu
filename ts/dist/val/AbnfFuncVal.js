"use strict";
/* Copyright (c) 2026 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseFuncVal = exports.AbnfFuncVal = void 0;
const type_1 = require("../type");
const FuncBaseVal_1 = require("./FuncBaseVal");
const StringVal_1 = require("./StringVal");
const MapVal_1 = require("./MapVal");
const ListVal_1 = require("./ListVal");
const ConjunctVal_1 = require("./ConjunctVal");
const err_1 = require("../err");
const grammar_1 = require("../grammar");
// `abnf(src)` -- compile a grammar, answer its source.
class AbnfFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isAbnfFunc = true;
    }
    funcname() {
        return 'abnf';
    }
    resolve(ctx, args) {
        const a = args[0];
        // NOT AN ARITY CHECK -- the arity gate refuses a short call before a
        // Val exists, and the signature gate refuses a settled non-string as
        // `func_arg`. What reaches here is a NIL argument, which both gates
        // pass over so the original refusal is the one a reader sees.
        if ('string' !== typeof a?.peg) {
            return this.place((0, err_1.makeNilErr)(ctx, 'abnf_grammar', this, undefined, 'abnf'));
        }
        // The compile is CACHED by source, so a grammar named at many sites
        // is built once -- and refused once, with the compiler's own reason.
        const [, why] = (0, grammar_1.compileGrammar)(a.peg);
        if (undefined !== why) {
            return this.place((0, err_1.makeNilErr)(ctx, 'abnf_grammar', this, undefined, 'abnf', { reason: why }));
        }
        return this.place(new StringVal_1.StringVal({ peg: a.peg }, ctx));
    }
}
exports.AbnfFuncVal = AbnfFuncVal;
// The AST as ordinary aontu values. `kids` is always present and always
// a list, because the vocabulary a caller writes against should not have
// to ask whether a leaf has the key at all.
function astVal(node, ctx) {
    // Every host node carries all three keys -- a leaf has `kids: []`
    // rather than no `kids` -- so there is nothing to default here. The
    // guarantee this function makes is about the SHAPE it answers, and
    // that is the ListVal below.
    const kids = node.kids.map((k, i) => astVal(k, ctx.descend('kids').descend(String(i))));
    return new MapVal_1.MapVal({
        peg: {
            rule: new StringVal_1.StringVal({ peg: node.rule }, ctx),
            src: new StringVal_1.StringVal({ peg: node.src }, ctx),
            kids: new ListVal_1.ListVal({ peg: kids }, ctx),
        }
    }, ctx);
}
// `parse(g, v)` -- apply a grammar to a string.
// `parse(g)` -- the same grammar as a CONSTRAINT on whatever meets it.
//
// The one-argument form is what a schema position wants, where there is
// no value yet to hand the call: `*"" | parse(G)` says the field is
// either the default or a string this grammar accepts. It is
// VALUE-PRESERVING, like every other constraint in the algebra -- the
// field keeps the string it was written with, and the tree is what the
// two-argument form is for. That is also what keeps it idempotent: a
// meet that returns its peer can be applied twice in any order.
class ParseFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isParseFunc = true;
    }
    funcname() {
        return 'parse';
    }
    // THE CONSTRAINT FORM MEETS ITS PEER rather than resolving, so it has
    // to see the peer before the base drives to resolve(). The grammar
    // argument is driven first -- it is normally a reference to an
    // `abnf()` call -- and until it settles the call HOLDS, exactly as an
    // unmet `min(3)` does. A settled string peer is then the check; every
    // other peer keeps the residual, so the constraint survives to meet a
    // value on a later pass.
    unify(peer, ctx) {
        if (1 !== this.peg.length) {
            return super.unify(peer, ctx);
        }
        this.driveStagedArgs(ctx, 1);
        // A STRING PEG IS A SETTLED GRAMMAR, so this is also the doneness
        // test: nothing carrying one is still resolving.
        const g = this.peg[0];
        if ('string' !== typeof g?.peg) {
            return this.residuate(peer, ctx);
        }
        // A SETTLED CONSTRAINT IS A STABLE VALUE, exactly as the residual
        // a constraint atom answers is (`this.dc = DONE` in ConstraintVal,
        // "a residual constraint is stable, like a ScalarKindVal"). Without
        // it the call was never done, so a `type()` holding one never
        // resolved and the whole schema it belonged to was ungeneratable --
        // `$.aontu.System.Semver & [1]` reported mapval_no_gen over the
        // schema itself.
        this.dc = type_1.DONE;
        const p = peer;
        if (true !== p?.isString || 'string' !== typeof p?.peg) {
            return this.hold(peer, ctx);
        }
        const [grammar, why] = (0, grammar_1.compileGrammar)(g.peg);
        if (undefined !== why) {
            return (0, err_1.makeNilErr)(ctx, 'abnf_grammar', this, peer, 'parse', { reason: why });
        }
        if ('' === p.peg) {
            return (0, err_1.makeNilErr)(ctx, 'parse_failed', this, peer, 'parse', { reason: 'the empty string parses under no grammar' });
        }
        const [, err] = (0, grammar_1.parseWith)(grammar, p.peg, ctx);
        if (undefined !== err) {
            return (0, err_1.makeNilErr)(ctx, 'parse_failed', this, peer, 'parse', { reason: err });
        }
        // ADMITTED: the peer stands, unchanged.
        return peer;
    }
    // THE STABLE TWIN OF residuate: the same cases, without the
    // `notdone()` -- a constraint whose grammar has settled is DONE and
    // stays DONE while it waits for a value (see the note in unify).
    //
    // THREE cases and not residuate's four: there is no nil arm, because
    // a NIL never arrives as this call's peer. A conjunct or a map
    // absorbs one before the func is driven against it, and this method
    // is reached only once the grammar has SETTLED -- a staged residual
    // is entered before that, which is why residuate's nil arm is live
    // and this one would be dead. A nil that did arrive would fall to
    // the conjunct below and be absorbed by it, which is the same
    // answer.
    hold(peer, ctx) {
        if (peer.isTop || peer.id === this.id) {
            // Cloned rather than returned, for the reason residuate clones:
            // a driver meeting the same object twice in one pass would
            // charge the revisit budget and report `unify_cycle`.
            const out = this.clone(ctx);
            out.dc = type_1.DONE;
            return out;
        }
        if (peer.isFunc
            && peer.funcname() === this.funcname()
            && peer.path.join('.') === this.path.join('.')
            && peer.canon === this.canon) {
            return this;
        }
        return new ConjunctVal_1.ConjunctVal({ peg: [this, peer] }, ctx);
    }
    resolve(ctx, args) {
        const g = args[0];
        const v = args[1];
        // NOT AN ARITY CHECK, for the reason `abnf`'s is not: the
        // one-argument form never reaches here (it returns from `unify`),
        // and a settled argument of the wrong kind is the signature gate's.
        // A NIL argument is what is left.
        if ('string' !== typeof g?.peg || 'string' !== typeof v?.peg) {
            return this.place((0, err_1.makeNilErr)(ctx, 'parse_arg', this, undefined, 'parse'));
        }
        const [grammar, why] = (0, grammar_1.compileGrammar)(g.peg);
        if (undefined !== why) {
            return this.place((0, err_1.makeNilErr)(ctx, 'abnf_grammar', this, undefined, 'parse', { reason: why }));
        }
        // THE EMPTY STRING IS NOT A PARSE. Both engines answer an empty
        // tree for empty input rather than refusing it, which would make
        // `parse(g, "")` succeed under every grammar; a validator whose
        // whole job is to refuse malformed input cannot have that.
        if ('' === v.peg) {
            return this.place((0, err_1.makeNilErr)(ctx, 'parse_failed', this, undefined, 'parse', { reason: 'the empty string parses under no grammar' }));
        }
        const [node, err] = (0, grammar_1.parseWith)(grammar, v.peg, ctx);
        if (undefined !== err) {
            return this.place((0, err_1.makeNilErr)(ctx, 'parse_failed', this, undefined, 'parse', { reason: err }));
        }
        return this.place(astVal(node, ctx));
    }
} /* node:coverage ignore next 6 */
exports.ParseFuncVal = ParseFuncVal;
//# sourceMappingURL=AbnfFuncVal.js.map