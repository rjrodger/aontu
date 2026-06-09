/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"os"
	"path/filepath"
	"strings"

	jsonic "github.com/jsonicjs/jsonic/go"
	multisource "github.com/jsonicjs/multisource/go"
)

// fileResolver resolves an @"path" reference by reading from disk,
// mirroring makeFileResolver in @jsonic/multisource (resolver/file.ts):
// resolve the full path, try it, then the implicit-extension potentials.
func fileResolver(spec multisource.PathSpec, opts *multisource.MultiSourceOptions) multisource.Resolution {
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
			res.Src = string(data)
			res.Found = true
			return res
		}
	}
	return res
}

// jsonicProcessor parses loaded source content with jsonic. Unlike the
// stock multisource.JsonicProcessor (which reuses the calling parser and
// thus its base), it parses each loaded file with a parser whose base is
// that file's own directory, so a relative @"file" load *inside* a
// loaded file resolves relative to that file — matching the canonical
// TypeScript @jsonic/multisource behaviour. res.Full is the absolute
// path of the resolved file (set by fileResolver).
func jsonicProcessor(res *multisource.Resolution, _ *multisource.MultiSourceOptions, j *jsonic.Jsonic) {
	if res.Src == "" {
		res.Val = nil
		return
	}
	lang := j
	if res.Full != "" {
		if l, err := langForBase(filepath.Dir(res.Full)); err == nil {
			lang = l
		}
	}
	val, err := lang.Parse(res.Src)
	if err != nil {
		res.Val = res.Src
		return
	}
	res.Val = val
}

// msOptions builds the multisource plugin options for the aontu grammar.
func msOptions(base string) map[string]any {
	return map[string]any{
		"_opts": &multisource.MultiSourceOptions{
			Resolver: fileResolver,
			Path:     base,
			Processor: map[string]multisource.Processor{
				"":       jsonicProcessor,
				"jsonic": jsonicProcessor,
				"aon":    jsonicProcessor,
				"aontu":  jsonicProcessor,
			},
			ImplicitExt: []string{".jsonic", ".aon", ".aontu"},
		},
	}
}
