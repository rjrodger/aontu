/* Copyright (c) 2026 Richard Rodger, MIT License */

// THE COMPONENT PRIMITIVES -- SPIKE (docs/design/JOSTRACA.0.md).
//
// `Folder`, `File` and `Content` are the first three of jostraca's
// component set, spelled as aontu functions and keeping jostraca's
// own capitalisation. They are the authoring surface an aontu
// document uses to say what FILES it produces:
//
//   out: Folder("src", [
//     File("main.ts", [
//       Content("export const x = 1")
//     ])
//   ])
//
// WHAT THIS REPLACES. `aontu:code` (ts/src/std.ts, test/spec/
// aontu-code.tsv) is a hand-written vocabulary an author fills in as
// DATA -- `code: units: [{path, lang, decls}]` -- and `aontu render`
// folds that instance into bytes. The instance is checked by
// unification against the vocabulary, which is the good half; the bad
// half is that an author writes a schema instance rather than a
// generator, the vocabulary owns every construct the renderer will
// ever emit, and nothing in it corresponds to a component someone can
// already write in jostraca. These primitives take the other road:
// the CALL is the construct, the call's own resolve is where the
// shape is refused, and the value it lands is a jostraca component
// tree that jostraca's build phase already knows how to walk.
//
// THE VALUE IS AN ORDINARY MAP, which is the whole reason this can be
// a spike at all. A component call resolves to
//
//   {cmp: "Folder", props: {name: "src"}, children: [...]}
//
// so nothing downstream needs new machinery: `generate()` emits the
// tree as JSON, `canon` renders the calls back, references and
// spreads reach into a tree as they reach into any map, and `form()`
// over model data drops straight into a `children` list -- which is
// the point, and is why the second argument must BE a list rather
// than accepting a bare node as a convenience. `form($.fields,
// Content(...))` is already the list; a one-child special case would
// make `File(n, form(...))` and `File(n, [form(...)])` both legal and
// different.
//
// CHILDREN FLATTEN, for the same reason. A generator's output lands
// in the MIDDLE of a written list --
//
//   File("planet.ts", [
//     Content("export interface Planet {"),
//     form($.fields, Content("  " + _ + ": string")),
//     Content("}")
//   ])
//
// -- and that list therefore holds two nodes and a LIST OF NODES. A
// list is not a node and could only be an error otherwise, so
// splicing is the total rule and nesting is not: children are
// flattened to any depth before the containment grammar is checked.
// This is the finding the spike's worked example produced; every
// component system that takes children arrives at it.
//
// THE NODE MAP IS CLOSED and its `props` map is not. The three keys
// are the vocabulary and a fourth is a mistake, so a typo in
// `Folder(...) & {childrn: []}` is refused where every other mistake
// in an aontu document is refused. Props are the COMPONENT's business
// -- jostraca's File already reads `mode` and `exclude`, and a
// component the spike does not implement will read its own -- so they
// pass through, and only the one prop each primitive cannot work
// without is checked here.
//
// THE CONTAINMENT GRAMMAR IS CHECKED AT THE CALL. A Folder holds
// folders and files, a File holds content, and Content holds nothing.
// Unification cannot state that on its own -- a node is a map, and
// every node map unifies with every other -- so the constructor
// states it, at the site the author wrote, which is the argument for
// making these functions rather than another vocabulary.
//
// NOT STAGED, deliberately. A component call answers from its
// arguments alone: it has no dependence on WHERE it sits (unlike
// `key()`) and it reads no bag that a sibling may still merge into
// (unlike `pack`/`each`/`form`). A children list BUILT by one of
// those combinators still waits, because the combinator residuates
// and the enclosing call is not `pegdone` until it fires -- so the
// ordinary args-done gate is the correct one and the staging rule
// costs nothing here.
//
// SPIKE SCOPE. TypeScript only; no Go port yet, and so:
// deliberately absent from `test/spec/signature.tsv`, from
// `BUILTIN_FUNCS` (ts/src/lsp.ts) and from the `grammar/` files, all
// three of which are pinned in cross-port parity and would go red on
// a TS-only change. Argument arity and shape are therefore refused
// HERE rather than by the parse-time arity table or the signature
// gate, both of which read the declaration this spike does not have.
// Failures are `invalid-arg` for the same reason -- a new code needs
// a row in test/spec/errcodes.tsv and an entry in BOTH ports' code
// tables (AGENTS.md, "The shared test suite").

import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { makeNilErr } from '../err'

import { MapVal } from './MapVal'
import { ListVal } from './ListVal'
import { StringVal } from './StringVal'
import { FuncBaseVal } from './FuncBaseVal'


// The component names this spike serves, each with the children it
// admits and the one prop it cannot work without. Adding a fourth
// primitive is an entry here plus the two-line subclass below.
type CmpDef = {
  // The children this component admits, by component name. Empty
  // means a leaf: any child at all is a mistake.
  children: string[]
  // The prop a bare string argument fills, and the prop that must be
  // a non-empty string once the props map is built.
  text: string
}

const CMP_DEF: Record<string, CmpDef> = {
  Folder: { children: ['Folder', 'File'], text: 'name' },
  File: { children: ['Content'], text: 'name' },
  Content: { children: [], text: 'src' },
}


// The component name a value carries, when the value is a node this
// vocabulary built. Read structurally rather than by class, because a
// node reaches a children list as a MAP -- through a reference, a
// `form()` instance, a spread -- long after the call that made it has
// resolved away.
function nodeCmp(v: any): string | undefined {
  if (true !== v?.isMap) {
    return undefined
  }
  const cmp: any = v.peg?.cmp
  const name = (true === cmp?.isScalar && 'string' === typeof cmp.peg) ?
    cmp.peg : undefined
  return (undefined !== name && undefined !== CMP_DEF[name]) ? name : undefined
}


// A prop's text, when the prop is a concrete string.
function propText(props: any, key: string): string | undefined {
  const v: any = props?.peg?.[key]
  return (true === v?.isScalar && 'string' === typeof v.peg) ? v.peg : undefined
}


class CmpFuncVal extends FuncBaseVal {
  isCmpFunc = true

  // The component this call builds: the function's own name, which is
  // also the `cmp` key of the node and the jostraca component the
  // bridge looks up.
  cmp: string

  constructor(
    cmp: string,
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
    this.cmp = cmp
  }


  funcname() {
    return this.cmp
  }


  resolve(ctx: AontuContext, args: Val[]): Val {
    const def: CmpDef = CMP_DEF[this.cmp]
    const leaf = 0 === def.children.length

    // ARITY, refused here (see the spike-scope note above): a leaf
    // takes its spec alone, a container takes a spec and an optional
    // children list.
    if (args.length < 1 || args.length > (leaf ? 1 : 2)) {
      return makeNilErr(ctx, 'invalid-arg', this, undefined, 'arity')
    }

    // THE SPEC IS A STRING OR A PROPS MAP. The string spelling fills
    // the one prop the component cannot work without, so the common
    // case reads as the component does -- `File("main.ts", ...)` --
    // and the map spelling is there the moment a second prop is
    // wanted: `File({name: "run.sh", mode: 0o755}, ...)`.
    const spec: any = args[0]
    let props: Val
    if (true === spec?.isScalar && 'string' === typeof spec.peg) {
      props = new MapVal({ peg: { [def.text]: spec } }, ctx)
    }
    else if (true === spec?.isMap) {
      props = spec
    }
    else {
      return makeNilErr(ctx, 'invalid-arg', this, spec, 'spec')
    }

    // The one prop that is not the component's own business: without
    // it there is no file to write and no content to write into one.
    const text = propText(props, def.text)
    if (undefined === text || '' === text) {
      return makeNilErr(ctx, 'invalid-arg', this, props, def.text)
    }

    // THE CHILDREN, flattened, then the containment grammar. Absent
    // is empty -- an empty folder and a file with no content are both
    // things a model may legitimately say -- and every node that
    // survives the flattening must be one this component admits.
    const kids: any = args[1]
    let children: Val
    if (undefined === kids) {
      children = new ListVal({ peg: [] }, ctx)
    }
    else if (true === kids?.isList) {
      const flat: Val[] = []
      const splice = (list: Val[]): Val | undefined => {
        for (const kid of list) {
          if (true === (kid as any)?.isList) {
            const bad = splice((kid as any).peg as Val[])
            if (undefined !== bad) {
              return bad
            }
            continue
          }
          const kcmp = nodeCmp(kid)
          if (undefined === kcmp || !def.children.includes(kcmp)) {
            return kid
          }
          flat.push(kid)
        }
        return undefined
      }
      const bad = splice(kids.peg as Val[])
      if (undefined !== bad) {
        return makeNilErr(ctx, 'invalid-arg', this, bad, 'children')
      }
      children = new ListVal({ peg: flat }, ctx)
    }
    else {
      return makeNilErr(ctx, 'invalid-arg', this, kids, 'children')
    }

    const node = new MapVal({
      peg: {
        cmp: new StringVal({ peg: this.cmp }, ctx),
        props,
        children,
      }
    }, ctx)

    // Closed: the three keys ARE the node vocabulary (see the note
    // above). `props` is left open on purpose.
    node.closed = true

    return this.place(node)
  }

} /* node:coverage ignore next 3 */


class FolderFuncVal extends CmpFuncVal {
  isFolderFunc = true

  constructor(spec: ValSpec, ctx?: AontuContext) {
    super('Folder', spec, ctx)
  }

  make(_ctx: AontuContext, spec: ValSpec): Val {
    return new FolderFuncVal(spec)
  }
} /* node:coverage ignore next 3 */


class FileFuncVal extends CmpFuncVal {
  isFileFunc = true

  constructor(spec: ValSpec, ctx?: AontuContext) {
    super('File', spec, ctx)
  }

  make(_ctx: AontuContext, spec: ValSpec): Val {
    return new FileFuncVal(spec)
  }
} /* node:coverage ignore next 3 */


class ContentFuncVal extends CmpFuncVal {
  isContentFunc = true

  constructor(spec: ValSpec, ctx?: AontuContext) {
    super('Content', spec, ctx)
  }

  make(_ctx: AontuContext, spec: ValSpec): Val {
    return new ContentFuncVal(spec)
  }
} /* node:coverage ignore next 9 */


export {
  CMP_DEF,
  CmpFuncVal,
  FolderFuncVal,
  FileFuncVal,
  ContentFuncVal,
}
