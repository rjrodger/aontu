/* Copyright (c) 2026 Richard Rodger, MIT License */

// THE COMPONENT PRIMITIVES -- SPIKE (docs/design/JOSTRACA.0.md).
//
// `Folder`, `File` and `Content` are the first three of jostraca's
// component set, spelled as aontu functions and keeping jostraca's
// own capitalisation. They are the authoring surface an aontu
// document uses to say what FILES it produces:
//
//   out: folder("src", [
//     file("main.ts", [
//       content("export const x = 1")
//     ])
//   ])
//
// WHAT THIS REPLACES. `aontu:code` (ts/src/std.ts, test/spec/
// aontu-code.tsv) is a hand-written vocabulary an author fills in as
// DATA -- `aontu: Code: units: [{path, lang, decls}]` -- and `aontu
// render` folds that instance into bytes. The instance is checked by
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
// spreads reach into a tree as they reach into any map, and `each()`
// over model data drops straight into a `children` list -- which is
// the point, and is why the second argument must BE a list rather
// than accepting a bare node as a convenience. `each($.fields,
// content(...))` is already the list; a one-child special case would
// make `file(n, each(...))` and `file(n, [each(...)])` both legal and
// different.
//
// CHILDREN FLATTEN, for the same reason. A generator's output lands
// in the MIDDLE of a written list --
//
//   file("planet.ts", [
//     content("export interface Planet {"),
//     each($.fields, content("  " + _ + ": string")),
//     content("}")
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
// `folder(...) & {childrn: []}` is refused where every other mistake
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
// (unlike `pack`/`each`). A children list BUILT by one of
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
  // The jostraca component this call builds. CAPITALISED, because it
  // names a component in the other project's exported set and the
  // bridge looks it up by that name -- while the aontu FUNCTION is
  // lower case, like every other builtin in this language. The two
  // spellings say what they are: `file(...)` is aontu, `"File"` is
  // jostraca's.
  cmp: string
  // The children this component admits, by aontu function name. Empty
  // means a leaf: any child at all is a mistake.
  children: string[]
  // The prop a bare string argument fills. ABSENT means the component
  // has no one-string spelling and its spec must be a map: `listitems`
  // is driven by a LIST, and there is no sensible string to promote.
  text?: string
  // Whether that prop is required. `project`'s folder is the one that
  // is not: jostraca defaults it to `.`, and the data path must not be
  // stricter than the component it drives.
  req: boolean
  // A prop that must be present and must be a list.
  bag?: string
}

// EIGHT OF JOSTRACA'S TEN COMPONENTS. `Copy` and `List` are missing and
// cannot be added under these rules: `copy` and `list` are already
// aontu builtins with settled, unrelated meanings -- `copy(v)` copies a
// VALUE and `list()` is the list container kind, both declared in
// test/spec/signature.tsv and implemented in both ports. Lower-casing
// jostraca's names onto them would either shadow landed language
// surface or make one name mean two things by arity, and neither is a
// trade a spike gets to make. See docs/design/JOSTRACA.0.md.
const CMP_DEF: Record<string, CmpDef> = {
  // The output root. Its `folder` is refused an absolute path or a
  // `..` segment on the jostraca side, where the tree is data.
  project: {
    cmp: 'Project', text: 'folder', req: false,
    children: ['project', 'folder', 'file', 'copyfiles'],
  },
  folder: {
    cmp: 'Folder', text: 'name', req: true,
    children: ['folder', 'file', 'copyfiles'],
  },
  file: {
    cmp: 'File', text: 'name', req: true,
    children: ['content', 'line', 'fragment', 'inject', 'listitems', 'copyfiles'],
  },
  // A span of text, exactly as written. `FileOp` joins a file's spans
  // with the empty string, so a `content` carries its own terminator.
  content: {
    cmp: 'Content', text: 'src', req: true,
    children: [],
  },
  // A span with a newline added, which is the whole difference.
  line: {
    cmp: 'Line', text: 'src', req: true,
    children: [],
  },
  // A file read from disk with its `<[SLOT]>` markers filled.
  fragment: {
    cmp: 'Fragment', text: 'from', req: true,
    children: ['slot', 'content', 'line', 'listitems'],
  },
  slot: {
    cmp: 'Slot', text: 'name', req: true,
    children: ['content', 'line', 'fragment', 'listitems'],
  },
  // A body written between markers in a file that already exists.
  inject: {
    cmp: 'Inject', text: 'name', req: true,
    children: ['content', 'line', 'listitems'],
  },
  // `Copy` under a name aontu has free: `copy` is taken by the builtin
  // that copies a VALUE, and a file copy is a different verb.
  copyfiles: {
    cmp: 'CopyFiles', text: 'from', req: true,
    children: [],
  },
  // `List` under a name that says what it does: it renders its children
  // ONCE PER ELEMENT of `item`, binding jostraca's `{item}` and
  // `{item.path}` macros, and adds a trailing blank line unless
  // `line: false`.
  //
  // IT IS THE ONE COMPONENT THE AONTU SIDE ALREADY SUBSUMES, and a
  // generator should reach for `each()` first. `each($.rows, content(...))`
  // repeats in the MODEL, so the repetition is finished before the tree
  // exists and every produced node is data a document can reference,
  // vet and diff. `listitems` defers it into jostraca's define phase behind
  // a string macro aontu cannot see into -- which is the layer this
  // spike exists to remove. It is here so the component set is
  // complete, not because it is the better spelling.
  listitems: {
    cmp: 'ListItems', req: true, bag: 'item',
    children: ['content', 'line', 'fragment'],
  },
}

// The component name a value carries, when the value is a node this
// vocabulary built. Read structurally rather than by class, because a
// node reaches a children list as a MAP -- through a reference, a
// `each()` instance, a spread -- long after the call that made it has
// resolved away.
const BY_CMP: Record<string, string> = {}
for (const fname of Object.keys(CMP_DEF)) {
  BY_CMP[CMP_DEF[fname].cmp] = fname
}

function nodeCmp(v: any): string | undefined {
  if (true !== v?.isMap) {
    return undefined
  }
  const cmp: any = v.peg?.cmp
  const name = (true === cmp?.isScalar && 'string' === typeof cmp.peg) ?
    cmp.peg : undefined
  // The node carries the JOSTRACA name; the grammar is written in aontu
  // names, so read it back through the one table.
  return (undefined === name) ? undefined : BY_CMP[name]
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
    // A component whose text prop is OPTIONAL may be called with
    // nothing at all: `project()` is the defaulted root, as
    // `project({})` is on the other side. Everything else needs its
    // spec.
    if (args.length < (def.req ? 1 : 0) || args.length > (leaf ? 1 : 2)) {
      return makeNilErr(ctx, 'invalid-arg', this, undefined, 'arity')
    }

    // THE SPEC IS A STRING OR A PROPS MAP. The string spelling fills
    // the one prop the component cannot work without, so the common
    // case reads as the component does -- `file("main.ts", ...)` --
    // and the map spelling is there the moment a second prop is
    // wanted: `file({name: "run.sh", mode: 0o755}, ...)`.
    const spec: any = args[0]
    let props: Val
    if (undefined === spec) {
      props = new MapVal({ peg: {} }, ctx)
    }
    else if (true === spec?.isScalar && 'string' === typeof spec.peg) {
      if (undefined === def.text) {
        return makeNilErr(ctx, 'invalid-arg', this, spec, 'spec')
      }
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
    if (undefined !== def.text) {
      const text = propText(props, def.text)
      if (def.req && (undefined === text || '' === text)) {
        return makeNilErr(ctx, 'invalid-arg', this, props, def.text)
      }
      if (!def.req && undefined !== (props as any).peg?.[def.text] &&
        undefined === text) {
        return makeNilErr(ctx, 'invalid-arg', this, props, def.text)
      }
    }

    // A bag prop is required and must be a list: `listitems` with no
    // `item` renders nothing, silently, which is the failure a data
    // path must not have.
    if (undefined !== def.bag) {
      const bag: any = (props as any).peg?.[def.bag]
      if (true !== bag?.isList) {
        return makeNilErr(ctx, 'invalid-arg', this, props, def.bag)
      }
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
        cmp: new StringVal({ peg: def.cmp }, ctx),
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


// ONE CLASS PER COMPONENT, generated from the table, because the
// registry constructs by `new funcval({peg: args})` and so needs a
// constructor per name. Written as a factory rather than eight
// near-identical subclasses: the table is the single statement of what
// exists, and a ninth component is a row in it and nothing else.
function cmpFuncClass(fname: string): any {
  class Cmp extends CmpFuncVal {
    constructor(spec: ValSpec, ctx?: AontuContext) {
      super(fname, spec, ctx)
    }

    make(_ctx: AontuContext, spec: ValSpec): Val {
      return new Cmp(spec)
    }
  }
  return Cmp
}


const CMP_FUNCS: Record<string, any> = {}
for (const fname of Object.keys(CMP_DEF)) {
  CMP_FUNCS[fname] = cmpFuncClass(fname)
} /* node:coverage ignore next 7 */


export {
  CMP_DEF,
  CMP_FUNCS,
  CmpFuncVal,
}
