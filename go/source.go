/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"os"
	"path/filepath"
	"strings"

	jsonic "github.com/tabnas/jsonic/go"
	multisource "github.com/tabnas/multisource/go"
)

// fileResolver resolves an @"path" reference by reading from disk,
// mirroring makeFileResolver in @tabnas/multisource (resolver/file.ts):
// resolve the full path, try it, then the implicit-extension potentials.
//
// SECURITY: @"path" reads any file the process can read — relative paths
// (`@"../../etc/passwd"`) and symlinks are followed with no containment
// check. This is intentional for the CLI, but it means a `.aon` source
// can exfiltrate referenced files; the LSP backs onto this same resolver,
// so treat opening an untrusted source as you would running it. If you
// embed aontu in a less-trusted context, supply a custom resolver via
// MultiSourceOptions that confines reads to an allowed root.
func fileResolver(spec multisource.PathSpec, opts *multisource.MultiSourceOptions, ctx *jsonic.Context) multisource.Resolution {
	res := multisource.Resolution{PathSpec: spec}

	var potentials []string
	if spec.Full != "" {
		full, _ := filepath.Abs(spec.Full)
		potentials = append(potentials, full)
		if filepath.Ext(full) == "" {
			for _, ext := range opts.ImplicitExt {
				potentials = append(potentials, full+ext)
			}
			for _, ext := range opts.ImplicitExt {
				potentials = append(potentials, filepath.Join(full, "index"+ext))
			}
		}
	}
	res.Search = potentials

	for _, p := range potentials {
		if data, err := os.ReadFile(p); err == nil {
			res.Full = p
			res.Kind = strings.TrimPrefix(filepath.Ext(p), ".")
			// Replace invalid UTF-8 as it is READ, exactly as parseBase
			// does for the entry source -- a loaded file reaches the parser
			// through the plugin, not through parseBase, so it needs its
			// own call or an include stays on the old per-byte behaviour
			// while the entry source no longer does (issue #32).
			res.Src = toValidSource(string(data))
			res.Found = true
			return res
		}
	}
	// A missing source must be an error, not a silently dropped load
	// (the multisource plugin injects nil for Found=false). Record it in
	// the parse meta bag -- which parseBase checks -- and mark the
	// resolution so notFoundProcessor can give the tree an error value.
	recordNotFound(ctx, res.Path)
	res.Kind = notFoundKind
	res.Found = true
	return res
}

// notFoundKind marks a Resolution for a source that could not be found.
const notFoundKind = "aontu-notfound"

// notFoundMetaKey is where a failed load is recorded for parseBase, in the
// jsonic parse meta bag.
//
// WHY THE META BAG AND NOT THE PARSED TREE. The obvious design -- inject an
// error nil and have parseBase find it by walking the result -- loses the
// error whenever `@"file"` is a bare MAP MEMBER rather than a value:
//
//	a: @"nofile"     the nil becomes the value of `a`, and survives
//	a:1 @"nofile"    the include MERGES into the enclosing map, and a nil
//	                 contributes no keys, so it vanishes without trace
//
// The second is the shape a real config uses most (`@"base.aon"` at the top
// of a file), and it produced a clean, plausible, INCOMPLETE document with
// exit 0 and no diagnostic -- a deleted or mistyped include silently
// yielding wrong config. The canonical TypeScript port raises during the
// parse and never had this hole.
//
// Wrapping the nil in a map to survive the merge does NOT work either, and
// the reason is worth recording so it is not attempted again: the plugin's
// mergeIntoParent copies the loaded value's keys into the parent one by one,
// so a wrapper carrying its own order list OVERWRITES the parent's and
// destroys the sibling keys -- while a wrapper without one is skipped by
// asValDepth, which converts only the keys the order list names.
//
// Recording at the point of DETECTION cannot be undone by anything
// downstream: no merge, no unification and no disjunction pruning can drop a
// fact that was never in the tree.
//
// The bag holds a POINTER (notFoundSink), not the message, so that a failure
// found inside a NESTED include propagates back to the entry parse -- see
// notFoundSink for why a plain value silently does not.
//
// The key carries the reserved sentinel prefix (see reservedKeyPrefix in
// lang.go) for the reason that prefix exists -- it shares a namespace with
// keys a source could otherwise write, and sources using the prefix are
// already refused.
const notFoundMetaKey = reservedKeyPrefix + "notfound"

// notFoundSink is the shared accumulator a parse hands to the resolver
// through the meta bag. It is a POINTER for the reason the whole mechanism
// works: the multisource plugin builds a nested parse's meta with a SHALLOW
// COPY of its parent's (childMeta), so every source in an include chain --
// at any depth -- ends up holding this same pointer, and a write from the
// deepest one is visible to the entry parse that allocated it.
//
// A plain string value in the bag is NOT enough, and that was the first
// version of this fix: it caught a bad include in the ENTRY source only.
// When the entry loaded a file that itself contained a bad bare-member
// include, the write landed in the child's copy of the map, the entry never
// saw it, and Go generated an incomplete document while TypeScript
// correctly refused. Found in review; the fixtures under
// test/spec/files/nest_missing*.aon pin it.
//
// Not synchronised, and does not need to be: the sink is allocated per
// parseBase call and a single parse runs on one goroutine. It never
// escapes to the cached, shared *jsonic.Jsonic.
type notFoundSink struct {
	msg string
}

// recordNotFound notes a failed load in the parse's shared sink.
//
// IT MUST BE CALLED FROM THE RESOLVER, NOT THE PROCESSOR. The resolver runs
// with the context of the parse that CONTAINS the include, so its meta bag
// still holds the sink pointer; the processor runs inside the include's own
// sub-parse. Verified by probing both, after the processor version silently
// did nothing.
//
// Only the FIRST failure is kept: TypeScript raises on the first missing
// source and stops, so reporting the first is what keeps the two ports'
// messages in step when a document has several bad includes.
func recordNotFound(ctx *jsonic.Context, path string) {
	if nil == ctx || nil == ctx.Meta {
		return
	}
	sink, ok := ctx.Meta[notFoundMetaKey].(*notFoundSink)
	if !ok || nil == sink {
		return
	}
	if "" == sink.msg {
		sink.msg = "source not found: " + path
	}
}

// notFoundProcessor injects the not-found error nil (see fileResolver).
//
// The failure is DETECTED via the meta bag, not here; this gives the tree an
// error value where the include was a value position, so nothing reads a
// hole before parseBase returns.
func notFoundProcessor(res *multisource.Resolution, _ *multisource.MultiSourceOptions, _ *jsonic.Context, _ *jsonic.Jsonic) {
	n := newNil("multisource_not_found")
	n.msg = "source not found: " + res.Path
	res.Val = n
}

// msOptions builds the multisource plugin options for the aontu grammar.
// As of multisource/go v0.1.6 the plugin resolves relative @"file" loads
// inside a loaded file against that file's own directory (via the jsonic
// context meta), matching the canonical TypeScript @tabnas/multisource,
// so the stock JsonicProcessor is used directly.
func msOptions(base string) map[string]any {
	return map[string]any{
		"_opts": &multisource.MultiSourceOptions{
			Resolver: fileResolver,
			Path:     base,
			Processor: map[string]multisource.Processor{
				"":           multisource.JsonicProcessor,
				"aon":        multisource.JsonicProcessor,
				"aontu":      multisource.JsonicProcessor,
				notFoundKind: notFoundProcessor,
			},
			// `.aon` is the preferred Aontu source extension; `.aontu`
			// also works. `.jsonic` is retired (no longer auto-resolved).
			ImplicitExt: []string{".aon", ".aontu"},
		},
	}
}
