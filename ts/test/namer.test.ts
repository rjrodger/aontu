/* Copyright (c) 2026 Richard Rodger, MIT License */

// `namer` -- NAME TRANSFORMATION (SPIKE, ts/src/val/NamerFuncVal.ts,
// docs/design/JOSTRACA.0.md). TypeScript only, so the cases live here
// rather than in test/spec/*.tsv: a shared row must pass in BOTH
// engines and the Go port has no `namer` yet.

import { describe, test } from 'node:test'
import * as Assert from 'node:assert'

import { expect } from './expect'

import { Aontu } from '..'
import { NAMER_STYLES } from '../dist/val/NamerFuncVal'


const A = new Aontu()
const G = (src: string) => A.generate(src)

const E = (src: string): string | undefined => {
  try {
    A.generate(src)
  }
  catch (err: any) {
    const errs = 'function' === typeof err?.errs ? err.errs() : []
    return errs[0]?.why
  }
  return undefined
}


describe('namer', () => {

  // THE MAP FORM: every spelling of one name, in one call. Nine keys,
  // and they are the vocabulary.
  test('every-spelling', () => {
    expect(G('x: namer("user_id")').x).equal({
      camel: 'userId',
      dot: 'user.id',
      human: 'User id',
      kebab: 'user-id',
      pascal: 'UserId',
      path: 'user/id',
      screaming: 'USER_ID',
      snake: 'user_id',
      title: 'User Id',
    })

    Assert.deepEqual(Object.keys(G('x: namer("a")').x).sort(),
      [...NAMER_STYLES].sort())
  })


  // THE SOURCE FORMAT IS NOT DECLARED, which is what makes this the
  // general case: N formats in and M out is one splitter and M
  // renderers, not N*M converters.
  test('any-format-in', () => {
    const spellings = [
      'user_id', 'userId', 'UserId', 'UserID', 'USER_ID',
      'user-id', 'user.id', 'user/id', 'user id',
    ]
    for (const s of spellings) {
      Assert.equal(G('x: namer("' + s + '", pascal)').x, 'UserId',
        s + ' should render as UserId')
      Assert.equal(G('x: namer("' + s + '", snake)').x, 'user_id')
    }
  })


  // The splitter is the RENDERER'S own (splitWords, ts/src/lower.ts),
  // so a name derived here and a name `aontu:profile`'s %case derives
  // cannot disagree. These are its hard cases.
  test('word-boundaries', () => {
    Assert.equal(G('x: namer("HTTPServer", snake)').x, 'http_server')
    Assert.equal(G('x: namer("XMLHttpRequest", screaming)').x,
      'XML_HTTP_REQUEST')
    Assert.equal(G('x: namer("utf8String", kebab)').x, 'utf-8-string')
    Assert.equal(G('x: namer("v2Api", snake)').x, 'v_2_api')
  })


  // THE ACRONYM SET is why a style alone is not enough: `ledgerId` is
  // `LedgerID` in Go and `ledgerId` in TypeScript, which is a fact
  // about the TARGET, so it is an argument.
  test('acronyms', () => {
    Assert.equal(G('x: namer("ledgerId", pascal)').x, 'LedgerId')
    Assert.equal(G('x: namer("ledgerId", pascal, [ID])').x, 'LedgerID')

    // Go's unexported spelling: camel never treats the FIRST word as
    // an acronym, and does treat the rest (caseName's rule, shared
    // with the renderer).
    Assert.equal(G('x: namer("ledgerId", camel, [ID])').x, 'ledgerID')
    Assert.equal(G('x: namer("idLedger", camel, [ID])').x, 'idLedger')

    // An all-caps word the splitter kept whole is rescued by the set.
    Assert.equal(G('x: namer("HTTPServer", pascal)').x, 'HttpServer')
    Assert.equal(G('x: namer("HTTPServer", pascal, [HTTP])').x, 'HTTPServer')

    // The map form takes the set as its SECOND argument, by shape: a
    // list is the acronyms, a string is the style.
    expect(G('x: namer("ledgerId", [ID])').x.pascal).equal('LedgerID')
    expect(G('x: namer("ledgerId", [ID])').x.camel).equal('ledgerID')
  })


  // MEMBERSHIP DECIDES AN ACRONYM, not how the input spelled it.
  // Asking whether `capitalise` changed the word made the same name
  // answer two ways depending on its source spelling.
  test('human-is-spelling-independent', () => {
    Assert.equal(G('x: namer("ledgerId", human, [ID])').x, 'Ledger ID')
    Assert.equal(G('x: namer("ledgerID", human, [ID])').x, 'Ledger ID')
    Assert.equal(G('x: namer("ledger_id", human, [ID])').x, 'Ledger ID')
    Assert.equal(G('x: namer("ledgerId", human)').x, 'Ledger id')

    // A leading acronym is one too.
    Assert.equal(G('x: namer("idNumber", human, [ID])').x, 'ID number')
  })


  // `.` and `/` are namer's separators, folded before the shared
  // splitter is asked -- `aontu:profile`'s %case set is unchanged.
  test('namers-own-separators-and-styles', () => {
    Assert.equal(G('x: namer("a.b/c", pascal)').x, 'ABC')
    Assert.equal(G('x: namer("userId", dot)').x, 'user.id')
    Assert.equal(G('x: namer("userId", path)').x, 'user/id')
    Assert.equal(G('x: namer("userId", title)').x, 'User Id')

    // `as-is` is the profile's way of saying "do nothing"; it is not a
    // spelling anyone asks a namer for, so it is not a style here.
    Assert.equal(E('x: namer("userId", "as-is")'), 'invalid-arg')
  })


  // THE MAP IS CLOSED: the nine keys are the vocabulary, so a typo is
  // refused rather than answering nothing.
  test('map-is-closed', () => {
    Assert.equal(E('x: namer("user_id") & {pascel: "y"}'), 'closed')
    Assert.equal(E('x: namer("user_id").pascel'), 'no_path')
  })


  test('refusals', () => {
    // The name.
    Assert.equal(E('x: namer(1)'), 'invalid-arg')
    Assert.equal(E('x: namer("")'), 'invalid-arg')
    Assert.equal(E('x: namer({a: 1})'), 'invalid-arg')

    // The style.
    Assert.equal(E('x: namer("a", pascel)'), 'invalid-arg')
    Assert.equal(E('x: namer("a", 1)'), 'invalid-arg')

    // The acronym set.
    Assert.equal(E('x: namer("a", pascal, [1])'), 'invalid-arg')
    Assert.equal(E('x: namer("a", pascal, [""])'), 'invalid-arg')
    Assert.equal(E('x: namer("a", pascal, "ID")'), 'invalid-arg')

    // Arity. No signature declaration exists for the spike, so the
    // parse-time table cannot refuse these and the call does.
    Assert.equal(E('x: namer()'), 'invalid-arg')
    Assert.equal(E('x: namer("a", pascal, [ID], 1)'), 'invalid-arg')
    // A list second argument is the acronym set, so there is no third
    // slot left to fill.
    Assert.equal(E('x: namer("a", [ID], pascal)'), 'invalid-arg')

    // A name that splits to no words at all.
    Assert.equal(E('x: namer("_", pascal)'), 'invalid-arg')
    Assert.equal(E('x: namer("_")'), 'invalid-arg')
  })


  // A PATH IS TEXT, and namer renames the text rather than tidying
  // it: `_ - space . /` are the separators and everything else is word
  // content, so the `$` root marker rides into the first word. Taking
  // the tail is `split`'s job, not this one's.
  test('a-path-is-text', () => {
    expect(G('z: x: {a: 1}\nz: y: namer(path($.z.x.a), kebab)').z.y)
      .equal('$-z-x-a')
    expect(G('z: x: {a: 1}\nz: y: namer(path(.x.a), kebab)').z.y)
      .equal('x-a')
  })


  // A forward reference residuates and answers once the model settles:
  // `namer` answers from its arguments alone and is not staged.
  test('forward-reference', () => {
    Assert.equal(G('x: namer($.n, pascal)\nn: $.m\nm: "user_id"').x, 'UserId')
  })


  // WHAT IT IS FOR. The spike's worked example wrote `Planet` out by
  // hand, because `upper("planet")` is `PLANET`. Now it derives.
  test('derives-the-identifier-a-generator-needs', () => {
    const out = G(`
model: { name: user_account fields: [id, emailAddress, ledgerId] }
ts: {
  type: "export interface " + namer($.model.name, pascal) + " {"
  fields: form($.model.fields, "  " + namer(_, camel) + ": string")
}
sql: {
  table: "create table " + namer($.model.name, snake) + " ("
  cols: form($.model.fields, "  " + namer(_, snake) + " text")
}
go: form($.model.fields, namer(_, pascal, [ID]))
`)
    expect(out.ts).equal({
      type: 'export interface UserAccount {',
      fields: ['  id: string', '  emailAddress: string', '  ledgerId: string'],
    })
    expect(out.sql).equal({
      table: 'create table user_account (',
      cols: ['  id text', '  email_address text', '  ledger_id text'],
    })
    // One model, three targets, one function -- and Go gets its own
    // acronym rule without the model knowing about Go.
    expect(out.go).equal(['ID', 'EmailAddress', 'LedgerID'])
  })

})
