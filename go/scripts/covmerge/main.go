/* Copyright (c) 2025 Richard Rodger, MIT License */

// Command covmerge unions two or more Go text coverage profiles
// (mode: set) into one, so the unit-test profile and the GOCOVERDIR
// integration-run profile of the command binaries can be reported as a
// single figure. Naive concatenation double-counts overlapping blocks;
// this keys each block and ORs the counts.
//
//	go run ./scripts/covmerge a.out b.out > merged.out
package main

import (
	"bufio"
	"fmt"
	"os"
	"sort"
	"strings"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Fprintln(os.Stderr, "usage: covmerge profile.out [profile.out ...]")
		os.Exit(2)
	}
	counts := map[string]int{}
	var order []string
	for _, path := range os.Args[1:] {
		f, err := os.Open(path)
		if err != nil {
			fmt.Fprintln(os.Stderr, "covmerge:", err)
			os.Exit(1)
		}
		sc := bufio.NewScanner(f)
		for sc.Scan() {
			line := sc.Text()
			if strings.HasPrefix(line, "mode:") || line == "" {
				continue
			}
			// FILE:START,END NUMSTMTS COUNT — split off the count.
			sp := strings.LastIndexByte(line, ' ')
			if sp < 0 {
				continue
			}
			key := line[:sp]
			cnt := 0
			fmt.Sscanf(line[sp+1:], "%d", &cnt)
			if _, seen := counts[key]; !seen {
				order = append(order, key)
			}
			if counts[key] < cnt {
				counts[key] = cnt
			}
		}
		f.Close()
	}
	sort.Strings(order)
	out := bufio.NewWriter(os.Stdout)
	defer out.Flush()
	fmt.Fprintln(out, "mode: set")
	for _, key := range order {
		fmt.Fprintf(out, "%s %d\n", key, counts[key])
	}
}
