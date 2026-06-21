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
func fileResolver(spec multisource.PathSpec, opts *multisource.MultiSourceOptions, _ *jsonic.Context) multisource.Resolution {
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
				"":      multisource.JsonicProcessor,
				"aon":   multisource.JsonicProcessor,
				"aontu": multisource.JsonicProcessor,
			},
			// `.aon` is the preferred Aontu source extension; `.aontu`
			// also works. `.jsonic` is retired (no longer auto-resolved).
			ImplicitExt: []string{".aon", ".aontu"},
		},
	}
}
