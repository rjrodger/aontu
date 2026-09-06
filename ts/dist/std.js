"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AONTU_MODELS = exports.AONTU_SCHEME = exports.STD_SOURCES = void 0;
// THE BUNDLED VOCABULARY (G4 phase 4,
// docs/capability-review/g4-identity-relations.md): `@"std/system"` is
// served from the engine itself — no filesystem, no package resolution
// — so a document may use it under every include capability except
// `none`, and the hermeticity posture is not widened by a source that
// never leaves the process.
//
// The TEXT is the shared artifact: go/std.go carries the same bytes,
// and test/spec/std-system.tsv pins its canon and its canon-hash in
// both engines, so the two copies cannot drift without a red suite.
// It carries no backtick for that reason: one string literal per port,
// and Go's raw string has no escape.
const STD_SYSTEM = `# std/system --- the SYSTEM VOCABULARY (G4 phase 4). Ports, components
# and relations need no syntax: they are schemas. Everything here is
# ordinary unification --- conjunction, spreads, marks, defaults ---
# so the vocabulary costs the language nothing, and an author who wants
# a different one writes it the same way.
#
# EXPERIMENTAL until the distribution layer can version it by
# canon-hash. Entity ids deliberately do NOT embed versions: fusing
# identity and version makes "v1 and v2 describe the same entity"
# inexpressible.

std: {

  # One end of a connection.
  Port: type({
    direction: *in | out | inout
    protocol?: string
  })

  # A node with ports. Where a Component sits in the tree is what it
  # is a component OF -- containment is the document's own structure
  # and needs no mark of its own.
  Component: type({
    ports?: {&: $.std.Port}
  })

  # A component that is a service. Written out rather than as
  # $.std.Component & {kind: service}: a reference from one member of
  # this file to another does not survive being INCLUDED into a
  # document (the marks the include carries make the referring member
  # unusable), so the vocabulary states each schema on its own.
  Service: type({
    kind: service
    ports?: {&: $.std.Port}
  })

  # (The Relation schema that used to sit here is retired with the
  # relations: magic key, RELATIONS.0.md P2: a relation is declared
  # by the graph atoms at its field -- rel(t) & acyclic() &
  # inverse(name) -- and the target half is rel(t)'s flow.)
}
`;
const STD_VIEW = `# std/view --- the FIGURE VOCABULARY (VIEWS.0.md, "6. The view
# document"). A view document declares its figures as data, and a
# declaration is just a map: this is the schema for one, so a typo is
# refused where every other mistake in an aontu document is refused --
# at evaluation, by unification -- rather than by the verb that reads
# it afterwards.
#
#   @"std/view"
#   @"./system.aon"
#
#   views: {&: $.view.Figure} & {
#     arch: {kind: matrix, order: partition, out: "docs/arch.dsm.txt"}
#   }
#
# The keys ARE the view options: the command-line flags without the
# dashes, one vocabulary for the CLI, the library and the file. The
# poset is not among the kinds, because a view document declares
# figures of the ONE document it includes and the poset compares
# several.
#
# EXPERIMENTAL until the distribution layer can version it by
# canon-hash. This file carries no backtick: it is one string literal
# per port, and Go raw strings have no escape.

view: {

  # One declared figure. The kind says what to draw and out says where
  # it belongs; everything else narrows the drawing, and each option
  # belongs to the kinds that read it.
  Figure: type({
    kind: doc | lattice | tree | matrix | graph | layer | sets | layers
      | ladder
    out: string

    # Every kind.
    as?: text | mermaid | dot | er | svg
    at?: string
    maxRows?: integer & min(0)

    # doc: how many levels of key to draw.
    depth?: integer & min(0)

    # tree, matrix, layer: the relation drawn. graph: the predicates
    # kept. tree: the subtrees drawn.
    relation?: string
    relations?: [&: string]
    roots?: [&: string]

    # matrix.
    order?: canon | partition
    closure?: boolean

    # graph, layer.
    groupBy?: string
    label?: string
    layers?: [&: string]
    edges?: upward | all | none

    # sets, layers.
    sets?: string
    member?: string
    universe?: string
    minDegree?: integer & min(0)
    maxCols?: integer & min(0)
    minSize?: integer & min(0)
  })
}
`;
// THE LANGUAGE-SUPPLIED MODELS (docs/design/MODELS.0.md D1;
// docs/design/RENDER.0.md P0 and P1). `aontu:NAME` is Node's device --
// a prefix no relative path, package name or module path can spell --
// so the resolver routes on it before any other leg and never touches
// the filesystem for it. Held in String.raw so the backslashes of the
// regexes reach the parser as written; no backtick, as above.
//
// aontu:code is the OUTPUT VOCABULARY: an instance of it is what a
// transform evaluates to and what `aontu render` folds to bytes.
// aontu:profile is the schema of a render profile, the data a unit of
// one language is rendered under. Both are pinned by canon and hash
// rows (test/spec/aontu-code.tsv, test/spec/aontu-profile.tsv).
const STD_CODE = String.raw `# aontu:code --- THE OUTPUT VOCABULARY. An aontu transform evaluates to
# an instance of this schema, and 'aontu render' turns the instance
# into bytes. Because it is an ordinary schema, a transform's result is
# checked by unification before anything is rendered.
#
#   @"aontu:code"
#   code: { units: [ { path: "out.py", lang: "python", decls: [
#     { k: "frag", of: emit($.model, %rules) } ] } ] }
#
# TWO ESCAPES, both counted by the render report: {k: "text", lang,
# text} carries verbatim target syntax, and 'x' is an open per-backend
# rider. CONTAINER TYPES TAKE LEAVES ONLY: anything deeper is a named
# alias declaration plus a {k: "ref"}, which keeps this schema's meet
# linear. A FRAGMENT IS FLAT: each piece carries its own depth ('at'),
# so the renderer owns every prefix and no piece nests another; a bare
# string piece is a line at depth 0, and no inline text may hold a line
# terminator -- that is checked here, before any renderer runs.
#
# THE ROOT IS NOT type()-MARKED, on purpose: 'aontu render' reads the
# instance through generate(), and a type()-marked subtree does not
# generate. A document that includes this vocabulary and writes no
# units generates 'code: {units: []}', which is what it said.
#
# EXPERIMENTAL until the distribution layer can version it by
# canon-hash.

%name = string & re("^[A-Za-z_][A-Za-z0-9_]*$") & length(min(1) & max(255))

%text = close({ k:"text" lang:string & length(min(1)) text:string })

%doc = close({
  text: string
  deprecated?: close({ msg?:string use?:string since?:string })
})

%check = close({ c:"min" n:number exclusive:*false | boolean })
  | close({ c:"max" n:number exclusive:*false | boolean })
  | close({ c:"re" p:string })
  | close({ c:"len" min?:integer & min(0) max?:integer & min(0) })
  | close({ c:"unique" key?:%name })
  | close({ c:"ne" of:[&: string | number | boolean] })
  | close({ c:"must" note:string })

%prim = close({
  k: "prim"
  prim: "string" | "int" | "bigint" | "float" | "decimal" | "bool" | "null" | "any"
})
%ref = close({ k:"ref" name:%name unit?:string })
%leaf = %prim | %ref | %text

%type = %leaf
  | close({ k:"list" of:%leaf })
  | close({ k:"map" key:%leaf of:%leaf })
  | close({ k:"opt" of:%leaf })
  | close({ k:"union" of:[&: %leaf] })
  | close({ k:"lit" of:[&: string | number | boolean | null] })

%field = close({
  name: %name
  type: %type
  optional: *false | boolean
  doc?: %doc
  default?: string | number | boolean | null
  check?: [&: %check]
  rel?: close({ to:string name?:string })
  x?: {}
})

%member = close({ name:%name value?:string | number doc?:%doc x?:{} })
%param = close({
  name: %name
  type: %type
  default?: string | number | boolean | null
  x?: {}
})

# THE FRAGMENT ALGEBRA. A line's inline pieces hold no terminator; a
# blank is its terminators alone; a raw is the one piece that may carry
# terminators, re-indented to its depth unless it says not to.
%inline = string & re("^[^\n\r]*$") | %ref
%line = close({ k:"line" at:*0 | integer & min(0) & max(64) of:[&: %inline] })
%blank = close({ k:"blank" n:*1 | integer & min(1) & max(16) })
%raw = close({
  k: "raw"
  at: *0 | integer & min(0) & max(64)
  text: string
  reindent: *true | boolean
})
%piece = %line | %blank | %raw | string & re("^[^\n\r]*$")
%frag = close({ k:"frag" of:[&: %piece] })
%body = %frag | close({ k:"abstract" })

%record = close({
  k: "record"
  name: %name
  doc?: %doc
  open: *false | boolean
  fields: [&: %field]
  entity?: string
  check?: [&: %check]
  x?: {}
})
%enum = close({ k:"enum" name:%name doc?:%doc members:[&: %member] x?:{} })
%alias = close({
  k: "alias"
  name: %name
  doc?: %doc
  type: %type
  check?: [&: %check]
  x?: {}
})
%const = close({
  k: "const"
  name: %name
  doc?: %doc
  type?: %type
  value: string | number | boolean | null
  x?: {}
})
%func = close({
  k: "func"
  name: %name
  doc?: %doc
  params: [&: %param]
  returns?: %type
  body: %body
  x?: {}
})

%decl = %record | %enum | %alias | %const | %func | %text | %frag

%import = close({
  from: string & length(min(1))
  names?: [&: %name]
  alias?: %name
  x?: {}
})

%unit = close({
  path: string & length(min(1))
  lang: string & length(min(1))
  pkg?: string
  doc?: %doc
  imports?: [&: %import]
  decls: [&: %decl]
  profile?: {}
  x?: {}
})

%source = close({ path?:string hash?:string & re("^aon1-[A-Za-z0-9_-]+$") })

code: close({ source?:%source units:[&: %unit] })
`;
const STD_PROFILE = String.raw `# aontu:profile --- THE PROFILE VOCABULARY. A profile is the data
# 'aontu render' applies to a unit of one language, and it is DATA and
# only data: a field belongs here only if the renderer applies it
# without looking at the shape of any node. Anything else is a lowering
# and lives in the transform.
#
#   @"aontu:profile"
#   profile: { lang: "python", indent: { unit: " ", width: 4 } }
#
# Three profiles are bundled with the engine -- aontu:lang/typescript,
# aontu:lang/go and aontu:lang/text -- and a unit is matched to one by
# its 'lang'. A fragment-only unit needs nothing beyond 'indent'.
#
# THE ROOT IS NOT type()-MARKED, for the reason aontu:code's is not:
# 'aontu render' reads a profile through generate().
#
# EXPERIMENTAL until the distribution layer can version it by
# canon-hash.

%name = string & re("^[A-Za-z_][A-Za-z0-9_]*$")

%case = "as-is" | "camel" | "pascal" | "snake" | "screaming" | "kebab"

%comment = close({ open?:string prefix?:string close?:string })

%form = close({
  open: *"" | string
  close: *"" | string
  prec: *9 | integer & min(0) & max(9)
  childPrec: *0 | integer & min(0) & max(9)
})

%profile = close({
  lang: string & length(min(1))
  lowering?: "typescript" | "go"
  indent: close({
    unit: *" " | string & length(min(1))
    width: *2 | integer & min(0) & max(16)
  })
  comment?: close({ line?:%comment block?:%comment doc?:%comment })
  str?: close({
    quote: *"\"" | string & length(min(1) & max(1))
    escape: { &: string }
  })
  ident?: close({
    chars: *"ascii-word" | "ascii-word"
    reserved?: [&: string]
    case?: close({
      record?: %case
      field?: %case
      enum?: %case
      member?: %case
      const?: %case
      func?: %case
      param?: %case
      alias?: %case
    })
    acronyms?: [&: %name]
  })
  types?: close({
    prim?: { &: string }
    list?: %form
    map?: %form
    opt?: %form
    union?: %form
    lit?: %form
  })
  banner?: string
})

profile: %profile
`;
exports.STD_SOURCES = {
    'std/system': STD_SYSTEM,
    'std/system.aon': STD_SYSTEM,
    'std/view': STD_VIEW,
    'std/view.aon': STD_VIEW,
    'aontu:code': STD_CODE,
    'aontu:profile': STD_PROFILE,
};
// The scheme of a language-supplied model, and the names it serves --
// the set the not-found message names, so a typo does not go looking
// on disk.
exports.AONTU_SCHEME = 'aontu:';
exports.AONTU_MODELS = Object.keys(exports.STD_SOURCES).filter((k) => k.startsWith(exports.AONTU_SCHEME)).sort();
//# sourceMappingURL=std.js.map