/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"os"
	"path/filepath"
	"sort"
	"strings"
	"testing"
)

// A module is a directory holding a file named after it: aontu/lang/go
// holds go.aon and is `aontu:lang/go`.
func walkModels(t *testing.T, dir, rel string, found []string) []string {
	entries, err := os.ReadDir(dir)
	if nil != err {
		t.Fatal(err)
	}
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		subrel := entry.Name()
		if "" != rel {
			subrel = rel + "/" + entry.Name()
		}
		sub := filepath.Join(dir, entry.Name())
		if _, err := os.Stat(filepath.Join(sub, entry.Name()+".aon")); nil == err {
			found = append(found, aontuScheme+subrel)
		}
		found = walkModels(t, sub, subrel, found)
	}
	return found
}

// go/aontumodel/ is a committed mirror because //go:embed cannot read
// above its own package directory, and a copy nothing compares is a second
// source of truth waiting to drift.
func TestAontuModelsAreTheCanonicalTree(t *testing.T) {
	if 0 == len(aontuModels) {
		t.Fatal("no models: has the generator run?")
	}
	norm := func(s string) string { return strings.ReplaceAll(s, "\r\n", "\n") }
	for _, name := range aontuModels {
		rel := strings.Split(strings.TrimPrefix(name, aontuScheme), "/")
		leaf := append([]string{"..", "aontu"}, rel...)
		leaf = append(leaf, rel[len(rel)-1]+".aon")
		shared, err := os.ReadFile(filepath.Join(leaf...))
		if nil != err {
			t.Fatal(err)
		}
		if norm(string(shared)) != norm(aontuSources[name]) {
			t.Fatalf("%s is stale against aontu/ - run `make aontu`", name)
		}
	}
}

// A model added to the tree and not regenerated is drift the table
// alone cannot see.
func TestAontuTreeServesExactlyTheListedModels(t *testing.T) {
	found := walkModels(t, filepath.Join("..", "aontu"), "", nil)
	sort.Strings(found)
	if strings.Join(found, ",") != strings.Join(aontuModels, ",") {
		t.Fatalf("aontu/ and aontuModels disagree - run `make aontu`: %v vs %v",
			found, aontuModels)
	}
	if !sort.StringsAreSorted(aontuModels) {
		t.Fatalf("aontuModels is not sorted: %v", aontuModels)
	}
	if len(aontuSources) != len(aontuModels) {
		t.Fatalf("aontuSources has %d entries for %d models",
			len(aontuSources), len(aontuModels))
	}
	for _, name := range aontuModels {
		if !strings.HasPrefix(name, aontuScheme) {
			t.Fatalf("%s does not carry the scheme", name)
		}
		if "" == aontuSources[name] {
			t.Fatalf("%s has no source", name)
		}
	}
}
