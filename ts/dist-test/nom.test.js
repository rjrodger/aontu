"use strict";
/* Copyright (c) 2026 Richard Rodger, MIT License */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// `nom` -- NAME TRANSFORMATION (SPIKE, ts/src/val/NomFuncVal.ts,
// docs/design/JOSTRACA.0.md). TypeScript only, so the cases live here
// rather than in test/spec/*.tsv: a shared row must pass in BOTH
// engines and the Go port has no `nom` yet.
const node_test_1 = require("node:test");
const Assert = __importStar(require("node:assert"));
const expect_1 = require("./expect");
const __1 = require("..");
const NomFuncVal_1 = require("../dist/val/NomFuncVal");
const A = new __1.Aontu();
const G = (src) => A.generate(src);
const E = (src) => {
    try {
        A.generate(src);
    }
    catch (err) {
        const errs = 'function' === typeof err?.errs ? err.errs() : [];
        return errs[0]?.why;
    }
    return undefined;
};
(0, node_test_1.describe)('nom', () => {
    // THE MAP FORM: every spelling of one name, in one call. Nine keys,
    // and they are the vocabulary.
    (0, node_test_1.test)('every-spelling', () => {
        (0, expect_1.expect)(G('x: nom("user_id")').x).equal({
            camel: 'userId',
            dot: 'user.id',
            text: 'User id',
            kebab: 'user-id',
            pascal: 'UserId',
            path: 'user/id',
            upper: 'USER_ID',
            snake: 'user_id',
            title: 'User Id',
        });
        Assert.deepEqual(Object.keys(G('x: nom("a")').x).sort(), [...NomFuncVal_1.NOM_STYLES].sort());
    });
    // THE SOURCE FORMAT IS NOT DECLARED, which is what makes this the
    // general case: N formats in and M out is one splitter and M
    // renderers, not N*M converters.
    (0, node_test_1.test)('any-format-in', () => {
        const spellings = [
            'user_id', 'userId', 'UserId', 'UserID', 'USER_ID',
            'user-id', 'user.id', 'user/id', 'user id',
        ];
        for (const s of spellings) {
            Assert.equal(G('x: nom("' + s + '", pascal)').x, 'UserId', s + ' should render as UserId');
            Assert.equal(G('x: nom("' + s + '", snake)').x, 'user_id');
        }
    });
    // The splitter is the RENDERER'S own (splitWords, ts/src/lower.ts),
    // so a name derived here and a name `aontu:profile`'s %case derives
    // cannot disagree. These are its hard cases.
    (0, node_test_1.test)('word-boundaries', () => {
        Assert.equal(G('x: nom("HTTPServer", snake)').x, 'http_server');
        Assert.equal(G('x: nom("XMLHttpRequest", upper)').x, 'XML_HTTP_REQUEST');
        Assert.equal(G('x: nom("utf8String", kebab)').x, 'utf-8-string');
        Assert.equal(G('x: nom("v2Api", snake)').x, 'v_2_api');
    });
    // THE ACRONYM SET is why a style alone is not enough: `ledgerId` is
    // `LedgerID` in Go and `ledgerId` in TypeScript, which is a fact
    // about the TARGET, so it is an argument.
    (0, node_test_1.test)('acronyms', () => {
        Assert.equal(G('x: nom("ledgerId", pascal)').x, 'LedgerId');
        Assert.equal(G('x: nom("ledgerId", pascal, [ID])').x, 'LedgerID');
        // Go's unexported spelling: camel never treats the FIRST word as
        // an acronym, and does treat the rest (caseName's rule, shared
        // with the renderer).
        Assert.equal(G('x: nom("ledgerId", camel, [ID])').x, 'ledgerID');
        Assert.equal(G('x: nom("idLedger", camel, [ID])').x, 'idLedger');
        // An all-caps word the splitter kept whole is rescued by the set.
        Assert.equal(G('x: nom("HTTPServer", pascal)').x, 'HttpServer');
        Assert.equal(G('x: nom("HTTPServer", pascal, [HTTP])').x, 'HTTPServer');
        // The map form takes the set as its SECOND argument, by shape: a
        // list is the acronyms, a string is the style.
        (0, expect_1.expect)(G('x: nom("ledgerId", [ID])').x.pascal).equal('LedgerID');
        (0, expect_1.expect)(G('x: nom("ledgerId", [ID])').x.camel).equal('ledgerID');
    });
    // MEMBERSHIP DECIDES AN ACRONYM, not how the input spelled it.
    // Asking whether `capitalise` changed the word made the same name
    // answer two ways depending on its source spelling.
    (0, node_test_1.test)('text-is-spelling-independent', () => {
        Assert.equal(G('x: nom("ledgerId", text, [ID])').x, 'Ledger ID');
        Assert.equal(G('x: nom("ledgerID", text, [ID])').x, 'Ledger ID');
        Assert.equal(G('x: nom("ledger_id", text, [ID])').x, 'Ledger ID');
        Assert.equal(G('x: nom("ledgerId", text)').x, 'Ledger id');
        // A leading acronym is one too.
        Assert.equal(G('x: nom("idNumber", text, [ID])').x, 'ID number');
    });
    // `.` and `/` are nom's separators, folded before the shared
    // splitter is asked -- `aontu:profile`'s %case set is unchanged.
    (0, node_test_1.test)('namers-own-separators-and-styles', () => {
        Assert.equal(G('x: nom("a.b/c", pascal)').x, 'ABC');
        Assert.equal(G('x: nom("userId", dot)').x, 'user.id');
        Assert.equal(G('x: nom("userId", path)').x, 'user/id');
        Assert.equal(G('x: nom("userId", title)').x, 'User Id');
        // `as-is` is the profile's way of saying "do nothing"; it is not a
        // spelling anyone asks a namer for, so it is not a style here.
        Assert.equal(E('x: nom("userId", "as-is")'), 'invalid-arg');
    });
    // THE MAP IS CLOSED: the nine keys are the vocabulary, so a typo is
    // refused rather than answering nothing.
    (0, node_test_1.test)('map-is-closed', () => {
        Assert.equal(E('x: nom("user_id") & {pascel: "y"}'), 'closed');
        Assert.equal(E('x: nom("user_id").pascel'), 'no_path');
    });
    (0, node_test_1.test)('refusals', () => {
        // The name.
        Assert.equal(E('x: nom(1)'), 'invalid-arg');
        Assert.equal(E('x: nom("")'), 'invalid-arg');
        Assert.equal(E('x: nom({a: 1})'), 'invalid-arg');
        // The style.
        Assert.equal(E('x: nom("a", pascel)'), 'invalid-arg');
        Assert.equal(E('x: nom("a", 1)'), 'invalid-arg');
        // The acronym set.
        Assert.equal(E('x: nom("a", pascal, [1])'), 'invalid-arg');
        Assert.equal(E('x: nom("a", pascal, [""])'), 'invalid-arg');
        Assert.equal(E('x: nom("a", pascal, "ID")'), 'invalid-arg');
        // Arity. No signature declaration exists for the spike, so the
        // parse-time table cannot refuse these and the call does.
        Assert.equal(E('x: nom()'), 'invalid-arg');
        Assert.equal(E('x: nom("a", pascal, [ID], 1)'), 'invalid-arg');
        // A list second argument is the acronym set, so there is no third
        // slot left to fill.
        Assert.equal(E('x: nom("a", [ID], pascal)'), 'invalid-arg');
        // A name that splits to no words at all.
        Assert.equal(E('x: nom("_", pascal)'), 'invalid-arg');
        Assert.equal(E('x: nom("_")'), 'invalid-arg');
    });
    // A PATH IS TEXT, and namer renames the text rather than tidying
    // it: `_ - space . /` are the separators and everything else is word
    // content, so the `$` root marker rides into the first word. Taking
    // the tail is `split`'s job, not this one's.
    (0, node_test_1.test)('a-path-is-text', () => {
        (0, expect_1.expect)(G('z: x: {a: 1}\nz: y: nom(path($.z.x.a), kebab)').z.y)
            .equal('$-z-x-a');
        (0, expect_1.expect)(G('z: x: {a: 1}\nz: y: nom(path(.x.a), kebab)').z.y)
            .equal('x-a');
    });
    // A forward reference residuates and answers once the model settles:
    // `nom` answers from its arguments alone and is not staged.
    (0, node_test_1.test)('forward-reference', () => {
        Assert.equal(G('x: nom($.n, pascal)\nn: $.m\nm: "user_id"').x, 'UserId');
    });
    // WHAT IT IS FOR. The spike's worked example wrote `Planet` out by
    // hand, because `upper("planet")` is `PLANET`. Now it derives.
    (0, node_test_1.test)('derives-the-identifier-a-generator-needs', () => {
        const out = G(`
model: { name: user_account fields: [id, emailAddress, ledgerId] }
ts: {
  type: "export interface " + nom($.model.name, pascal) + " {"
  fields: each($.model.fields, "  " + nom(_, camel) + ": string")
}
sql: {
  table: "create table " + nom($.model.name, snake) + " ("
  cols: each($.model.fields, "  " + nom(_, snake) + " text")
}
go: each($.model.fields, nom(_, pascal, [ID]))
`);
        (0, expect_1.expect)(out.ts).equal({
            type: 'export interface UserAccount {',
            fields: ['  id: string', '  emailAddress: string', '  ledgerId: string'],
        });
        (0, expect_1.expect)(out.sql).equal({
            table: 'create table user_account (',
            cols: ['  id text', '  email_address text', '  ledger_id text'],
        });
        // One model, three targets, one function -- and Go gets its own
        // acronym rule without the model knowing about Go.
        (0, expect_1.expect)(out.go).equal(['ID', 'EmailAddress', 'LedgerID']);
    });
});
//# sourceMappingURL=nom.test.js.map