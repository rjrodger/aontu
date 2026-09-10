/* Copyright (c) 2025 Richard Rodger, MIT License */

package main

import (
	"os"

	"github.com/aontu-lang/aontu/go/lsp"
)

func main() { //coverage:ignore run under GOCOVERDIR by `make cov-go`
	os.Exit(lsp.Serve(os.Stdin, os.Stdout, os.Stderr))
}
