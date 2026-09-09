/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"sort"
	"strings"
)

// THE LANGUAGE-SUPPLIED MODELS (G4 phase 4,
// docs/capability-review/g4-identity-relations.md, and the Go side of
// ts/src/std.ts): `@"aontu:system"` is served from the engine itself —
// no filesystem, no package resolution — so a document may use it under
// every include capability except `none`, and the hermeticity posture
// is not widened by a source that never leaves the process.
//
// EVERY name here carries the `aontu:` prefix (ADR-028): a
// language-supplied schema is spelled one way, and the scheme is what
// makes it unshadowable. There is no second, bare-name spelling.
//
// The TEXT is the shared artifact: ts/src/std.ts carries the same
// bytes, and test/spec/aontu-system.tsv pins its canon and its
// canon-hash in both engines, so the two copies cannot drift without a
// red suite.
// It carries no backtick for that reason: one string literal per port,
// and Go's raw string has no escape.

const stdSystem = `# aontu:system --- the SYSTEM VOCABULARY (G4 phase 4). Ports, components
# and relations need no syntax: they are schemas. Everything here is
# ordinary unification --- conjunction, spreads, marks, defaults ---
# so the vocabulary costs the language nothing, and an author who wants
# a different one writes it the same way.
#
# EXPERIMENTAL until the distribution layer can version it by
# canon-hash. Entity ids deliberately do NOT embed versions: fusing
# identity and version makes "v1 and v2 describe the same entity"
# inexpressible.

system: {
  # One end of a connection.
  Port: type({ direction:*in | out | inout protocol?:string })

  # A node with ports. Where a Component sits in the tree is what it
  # is a component OF -- containment is the document's own structure
  # and needs no mark of its own.
  Component: type({ ports?:{ &: $.system.Port } })

  # A component that is a service. Written out rather than as
  # $.system.Component & {kind: service}: a reference from one member of
  # this file to another does not survive being INCLUDED into a
  # document (the marks the include carries make the referring member
  # unusable), so the vocabulary states each schema on its own.
  Service: type({ kind:service ports?:{ &: $.system.Port } })

  # A semantic version, as an ORDERED TRIPLE: major, minor, patch, each
  # a non-negative integer. A list and not a string, because "1.10.0"
  # sorts below "1.9.0" as text and a version is compared, not read; a
  # list and not a map, because the comparison is elementwise from the
  # left and a map has no order of its own to compare along.
  Semver: type([&: integer & min(0)] & length(3))
  # (The Relation schema that used to sit here is retired with the
  # relations: magic key, RELATIONS.0.md P2: a relation is declared
  # by the graph atoms at its field -- rel(t) & acyclic() &
  # inverse(name) -- and the target half is rel(t)'s flow.)
}
`

const stdView = `# aontu:view --- the FIGURE VOCABULARY (VIEWS.0.md, "6. The view
# document"). A view document declares its figures as data, and a
# declaration is just a map: this is the schema for one, so a typo is
# refused where every other mistake in an aontu document is refused --
# at evaluation, by unification -- rather than by the verb that reads
# it afterwards.
#
#   @"aontu:view"
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
`

// stdSources are the language-supplied models, by the name a document
// writes. Every key carries the `aontu:` prefix and the scheme is not a
// directory, so there is no `.aon` spelling (ADR-028).
var stdSources = map[string]string{
	"aontu:system":          stdSystem,
	"aontu:view":            stdView,
	"aontu:code":            stdCode,
	"aontu:lang/go":         stdLangGo,
	"aontu:lang/text":       stdLangText,
	"aontu:lang/typescript": stdLangTypescript,
	"aontu:profile":         stdProfile,
}

// aontuScheme is the prefix of a language-supplied model
// (docs/design/MODELS.0.md D1; docs/design/RENDER.0.md P0): Node's
// device, a spelling no relative path, package name or module path can
// reach, so the resolver routes on it before any other leg and never
// touches the filesystem for it.
const aontuScheme = "aontu:"

// aontuModels lists the names the scheme serves, sorted, for the
// not-found message: a typo in an aontu: name is refused naming the
// set rather than searched for on disk.
func aontuModels() []string {
	names := []string{}
	for name := range stdSources {
		if strings.HasPrefix(name, aontuScheme) {
			names = append(names, name)
		}
	}
	sort.Strings(names)
	return names
}

// THE LANGUAGE-SUPPLIED MODELS (docs/design/MODELS.0.md D1;
// docs/design/RENDER.0.md P0 and P1), the Go side of ts/src/std.ts.
// aontu:code is the OUTPUT VOCABULARY: an instance of it is what a
// transform evaluates to and what `aontu render` folds to bytes.
// aontu:profile is the schema of a render profile, the data a unit of
// one language is rendered under. Both are pinned by canon and hash
// rows (test/spec/aontu-code.tsv, test/spec/aontu-profile.tsv); the
// texts carry no backtick, and the raw string keeps their backslashes.
const stdCode = `# aontu:code --- THE OUTPUT VOCABULARY. An aontu transform evaluates to
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
`

const stdProfile = `# aontu:profile --- THE PROFILE VOCABULARY. A profile is the data
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
`

// stdLangText is the text profile (RENDER.0.md D5): the profile of a
// fragment-only unit, and the fallback of every language without a
// lowering. The same bytes as STD_LANG_TEXT in ts/src/std.ts.
const stdLangText = `# aontu:lang/text --- THE TEXT PROFILE. The profile of a unit whose
# declarations are fragments and text escapes only: indentation, and
# nothing else, since a fold over fragments applies nothing else. Every
# language without a lowering renders under it (docs/design/RENDER.0.md
# D5), and a reference inline renders as its name, verbatim.
#
# EXPERIMENTAL until the distribution layer can version it by
# canon-hash.

@"aontu:profile"

profile: { lang:"text" indent:{ unit:" " width:2 } }
`

// stdLangTypescript is the TypeScript profile (RENDER.0.md D5, P5), the
// Go side of STD_LANG_TYPESCRIPT in ts/src/std.ts: the same bytes,
// pinned by a hash row.
const stdLangTypescript = `# aontu:lang/typescript --- THE TYPESCRIPT PROFILE. The data a unit of
# TypeScript renders under: indentation, the comment forms, the string
# quote and its escape table, the identifier rules and the type forms.
# The lowering of a declaration to an exported interface is code
# (docs/design/RENDER.0.md D5); everything the lowering reads without
# looking at the shape of a node is here.
#
# EXPERIMENTAL until the distribution layer can version it by
# canon-hash.

@"aontu:profile"

profile: {
  lang: "typescript"
  lowering: "typescript"
  indent: { unit:" " width:2 }
  comment: line: prefix: "// "
  comment: block: { open:"/*" prefix:" * " close:" */" }
  comment: doc: { open:"/**" prefix:" * " close:" */" }
  str: quote: "\""
  str: escape: {
    "8": "\\b"
    "9": "\\t"
    "10": "\\n"
    "12": "\\f"
    "13": "\\r"
    "34": "\\\""
    "92": "\\\\"
  }
  ident: {
    chars: "ascii-word"
    reserved: [
      "await"
      "break"
      "case"
      "catch"
      "class"
      "const"
      "continue"
      "debugger"
      "default"
      "delete"
      "do"
      "else"
      "enum"
      "export"
      "extends"
      "false"
      "finally"
      "for"
      "function"
      "if"
      "implements"
      "import"
      "in"
      "instanceof"
      "interface"
      "let"
      "new"
      "null"
      "package"
      "private"
      "protected"
      "public"
      "return"
      "static"
      "super"
      "switch"
      "this"
      "throw"
      "true"
      "try"
      "typeof"
      "var"
      "void"
      "while"
      "with"
      "yield"
    ]
    case: record: "pascal"
    case: field: "camel"
    case: enum: "pascal"
    case: member: "pascal"
    case: const: "camel"
    case: func: "camel"
    case: param: "camel"
    case: alias: "pascal"
    acronyms: []
  }
  types: prim: {
    string: "string"
    int: "number"
    bigint: "bigint"
    float: "number"
    decimal: "string"
    bool: "boolean"
    null: "null"
    any: "unknown"
  }
  types: list: { close:"[]" childPrec:2 }
  types: map: { open:"Record<" close:">" }
  types: opt: { close:" | null" prec:1 childPrec:2 }
  types: union: { prec:1 childPrec:2 }
  types: lit: prec: 1
  banner: "Code generated by aontu from {path}. DO NOT EDIT."
}
`

// stdLangGo is the Go profile (RENDER.0.md D5, P5), the Go side of
// STD_LANG_GO in ts/src/std.ts: the same bytes, pinned by a hash row.
const stdLangGo = `# aontu:lang/go --- THE GO PROFILE. The data a unit of Go renders
# under: a tab of indentation, the comment forms, the string quote and
# its escape table, the identifier rules -- pascal by role, and the
# acronym set that spells ID and URL -- and the type forms. The lowering
# of a declaration to a struct type is code (docs/design/RENDER.0.md D5);
# everything the lowering reads without looking at the shape of a node
# is here.
#
# EXPERIMENTAL until the distribution layer can version it by
# canon-hash.

@"aontu:profile"

profile: {
  lang: "go"
  lowering: "go"
  indent: { unit:"\t" width:1 }
  comment: { line:prefix:"// " block:{ open:"/*" close:"*/" } doc:prefix:"// " }
  str: quote: "\""
  str: escape: {
    "7": "\\a"
    "8": "\\b"
    "9": "\\t"
    "10": "\\n"
    "11": "\\v"
    "12": "\\f"
    "13": "\\r"
    "34": "\\\""
    "92": "\\\\"
  }
  ident: {
    chars: "ascii-word"
    reserved: [
      "break"
      "case"
      "chan"
      "const"
      "continue"
      "default"
      "defer"
      "else"
      "fallthrough"
      "for"
      "func"
      "go"
      "goto"
      "if"
      "import"
      "interface"
      "map"
      "package"
      "range"
      "return"
      "select"
      "struct"
      "switch"
      "type"
      "var"
    ]
    case: record: "pascal"
    case: field: "pascal"
    case: enum: "pascal"
    case: member: "pascal"
    case: const: "pascal"
    case: func: "pascal"
    case: param: "camel"
    case: alias: "pascal"
    acronyms: [
      "ACL"
      "API"
      "ASCII"
      "CPU"
      "CSS"
      "DNS"
      "EOF"
      "GUID"
      "HTML"
      "HTTP"
      "HTTPS"
      "ID"
      "IP"
      "JSON"
      "LHS"
      "QPS"
      "RAM"
      "RHS"
      "RPC"
      "SLA"
      "SMTP"
      "SQL"
      "SSH"
      "TCP"
      "TLS"
      "TTL"
      "UDP"
      "UI"
      "UID"
      "UUID"
      "URI"
      "URL"
      "UTF8"
      "VM"
      "XML"
      "XMPP"
      "XSRF"
      "XSS"
    ]
  }
  types: prim: {
    string: "string"
    int: "int64"
    bigint: "string"
    float: "float64"
    decimal: "string"
    bool: "bool"
    null: "any"
    any: "any"
  }
  types: list: open: "[]"
  types: map: open: "map["
  types: opt: open: "*"
  banner: "Code generated by aontu from {path}. DO NOT EDIT."
}
`
