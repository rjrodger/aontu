/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

package aontu

import (
	"os"
	"path/filepath"

	jsonic "github.com/jsonicjs/jsonic/go"
)

// resolveFile reads a multisource path, supporting common extension fallbacks
// when the spec has no extension. basePath is the directory of the importing
// source (empty for top-level absolute paths).
func resolveFile(spec, basePath string) (fullPath, src string, found bool) {
	candidate := spec
	if !filepath.IsAbs(candidate) && basePath != "" {
		candidate = filepath.Join(basePath, candidate)
	}
	candidate = filepath.Clean(candidate)

	if data, err := os.ReadFile(candidate); err == nil {
		return candidate, string(data), true
	}

	if filepath.Ext(candidate) == "" {
		for _, ext := range []string{".jsonic", ".aontu", ".aon", ".jsc", ".json"} {
			full := candidate + ext
			if data, err := os.ReadFile(full); err == nil {
				return full, string(data), true
			}
		}
	}

	return candidate, "", false
}

// installMultiSource registers the @"path" file-import directive on the parser.
// Mirrors @jsonic/multisource: an `@` token followed by a string path loads
// and recursively parses the referenced file. The loaded Val replaces the
// directive in pair-value position, or merges as a conjunct sibling in
// map-sibling and top-level positions.
func installMultiSource(l *Lang, j *jsonic.Jsonic) {
	OPEN := j.Token("#OD_multisource", "@")

	j.Rule("multisource", func(rs *jsonic.RuleSpec, _ *jsonic.Parser) {
		rs.Open = []*jsonic.AltSpec{
			{P: "val", G: "multisource,aontu"},
		}
		rs.AddBC(func(r *jsonic.Rule, ctx *jsonic.Context) {
			spec := extractPathSpec(r)
			if spec == "" {
				r.Node = NewNilVal(&ValSpec{Why: "multisource_empty_path"})
				return
			}

			basePath := ""
			if ms, ok := ctx.Meta["multisource"].(map[string]any); ok {
				if p, ok := ms["path"].(string); ok && p != "" {
					basePath = filepath.Dir(p)
				}
			}

			full, src, ok := resolveFile(spec, basePath)
			if !ok {
				r.Node = NewNilVal(&ValSpec{
					Why: "multisource_not_found",
					Msg: "source not found: " + spec,
				})
				return
			}

			childMeta := map[string]any{
				"multisource": map[string]any{"path": full},
			}
			parsed, err := j.ParseMeta(src, childMeta)
			if err != nil {
				r.Node = NewNilVal(&ValSpec{
					Why: "multisource_parse_error",
					Msg: err.Error(),
				})
				return
			}

			fileVal := l.wrapVal(parsed, r, ctx)

			parent := r.Parent
			if parent != nil && parent.Name == "pair" {
				if _, marked := parent.U["ms"]; marked {
					injectMergeSibling(parent.Parent, fileVal)
					r.Node = nil
					return
				}
			}
			r.Node = fileVal
		})
	})

	j.Rule("val", func(rs *jsonic.RuleSpec, _ *jsonic.Parser) {
		rs.PrependOpen(
			&jsonic.AltSpec{
				S: [][]jsonic.Tin{{OPEN}},
				C: func(r *jsonic.Rule, _ *jsonic.Context) bool {
					return r.D == 0
				},
				P: "map", B: 1,
				G: "multisource,top,aontu",
			},
			&jsonic.AltSpec{
				S: [][]jsonic.Tin{{OPEN}},
				P: "multisource",
				G: "multisource,val,aontu",
			},
		)
	})

	j.Rule("map", func(rs *jsonic.RuleSpec, _ *jsonic.Parser) {
		rs.PrependOpen(
			&jsonic.AltSpec{
				S: [][]jsonic.Tin{{OPEN}},
				P: "pair", B: 1,
				G: "multisource,map,aontu",
			},
		)
		// Inside a nested map (pk > 0), seeing @ backtracks so the @
		// propagates to the enclosing map's open alt instead of being
		// captured by an implicit-pair continuation. Mirrors the TS
		// multisource grammar's `map.close` rule for OPEN.
		rs.PrependClose(
			&jsonic.AltSpec{
				S: [][]jsonic.Tin{{OPEN}},
				C: func(r *jsonic.Rule, _ *jsonic.Context) bool {
					return r.N["pk"] > 0
				},
				B: 1,
				G: "multisource,map,aontu",
			},
		)
	})

	j.Rule("pair", func(rs *jsonic.RuleSpec, _ *jsonic.Parser) {
		rs.PrependOpen(
			&jsonic.AltSpec{
				S: [][]jsonic.Tin{{OPEN}},
				P: "multisource",
				U: map[string]any{"ms": true},
				G: "multisource,pair,aontu",
			},
		)
		// In a nested pair (pk > 0), encountering @ backtracks so the
		// nested pair closes and @ surfaces to the enclosing map.
		rs.PrependClose(
			&jsonic.AltSpec{
				S: [][]jsonic.Tin{{OPEN}},
				C: func(r *jsonic.Rule, _ *jsonic.Context) bool {
					return r.N["pk"] > 0
				},
				B: 1,
				G: "multisource,pair,aontu",
			},
		)
	})
}

// extractPathSpec gets the path string from the multisource rule's child val.
// The val rule's BC wraps raw strings as StringVal, so the typical case is
// *StringVal; bare-string fallback covers any path where wrapping was skipped.
func extractPathSpec(r *jsonic.Rule) string {
	if r.Child == nil {
		return ""
	}
	switch v := r.Child.Node.(type) {
	case *StringVal:
		if s, ok := v.peg.(string); ok {
			return s
		}
	case string:
		return v
	}
	return ""
}

// injectMergeSibling adds a Val to the map rule's pending ___merge list.
// wrapMap consumes ___merge to build a ConjunctVal of the map and its
// sibling factors, matching the TS canon `{outer}&{file1}&{file2}`.
func injectMergeSibling(mapRule *jsonic.Rule, val Val) {
	if mapRule == nil || mapRule.Name != "map" {
		return
	}
	pm, ok := mapRule.Node.(map[string]any)
	if !ok {
		pm = make(map[string]any)
		mapRule.Node = pm
	}
	if existing, ok := pm["___merge"].([]interface{}); ok {
		pm["___merge"] = append(existing, val)
	} else {
		pm["___merge"] = []interface{}{val}
	}
}
