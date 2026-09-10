/* Copyright (c) 2026 Richard Rodger, MIT License */

package aontu

// THE GRAMMAR SEAM (G9): compiling an ABNF grammar, and running it
// under aontu's own budget. Twin of ts/src/grammar.ts.
//
// THE PARSE IS BOUNDED, and that is not optional. re() carries the
// ReDoS guard because a regex match is counted by no evaluator budget
// (docs/trust.md clause 2), and a user-supplied grammar is strictly
// more expressive than the pattern subset that guard admits. The
// engine's cancellation hook is what makes this answerable: it calls
// back every N rule iterations and a false cancels the parse.

import (
	"strings"
	"sync"

	tabnasabnf "github.com/tabnas/abnf/go"
	tabnas "github.com/tabnas/parser/go"
)

// The parse step ceiling. Deliberately a CONSTANT rather than a trust
// knob: the budgets a profile may lower or raise (passes, depth) bound
// aontu's own evaluation, and this bounds a third party's.
const parseStepMax = 100000

// How often the engine asks.
const parseCheckEvery = 100

type grammarEntry struct {
	tn  *tabnas.Tabnas
	why string
}

// Compiled grammars, by source. Guarded because a host may unify on
// more than one goroutine; the TS twin needs no lock and says so.
var (
	grammarMu    sync.Mutex
	grammarCache = map[string]*grammarEntry{}
	parseSteps   int
)

func compileGrammar(src string) (*tabnas.Tabnas, string) {
	grammarMu.Lock()
	defer grammarMu.Unlock()

	if hit, has := grammarCache[src]; has {
		return hit.tn, hit.why
	}

	entry := &grammarEntry{}

	// Whitespace is NOT skipped: a grammar aontu runs describes a
	// string with no spaces in it (a version, an address, a media
	// type), and the engine's lexer would otherwise read `1 . 2 . 3`
	// as `1.2.3` -- accepting input the grammar's author did not.
	//
	// The budget hook is installed HERE because the engine takes it at
	// construction, not per parse. A compiled grammar is cached and
	// reused, so the counter it reads is reset by parseWith before each
	// run rather than captured per call.
	no := false
	tn := tabnas.Make(tabnas.Options{
		Space: &tabnas.SpaceOptions{Lex: &no},
		Parse: &tabnas.ParseOptions{Budget: &tabnas.BudgetOptions{
			CheckEveryN: parseCheckEvery,
			OnCheck: func(_ *tabnas.Context) bool {
				parseSteps += parseCheckEvery
				return parseSteps <= parseStepMax
			},
		}},
	})

	if _, err := tabnasabnf.Install(tn, src, nil, nil); err != nil {
		entry.why = firstLine(err.Error())
	} else {
		entry.tn = tn
	}

	grammarCache[src] = entry
	return entry.tn, entry.why
}

func parseWith(grammar *tabnas.Tabnas, text string) (any, string) {
	grammarMu.Lock()
	defer grammarMu.Unlock()

	parseSteps = 0
	node, err := grammar.Parse(text)
	if err != nil {
		return nil, firstLine(err.Error())
	}
	return node, ""
}

// The first line of a host message. Both ports report the compiler's
// or the parser's own first line, so a reason reads the same in each.
func firstLine(s string) string {
	if i := strings.IndexByte(s, '\n'); 0 <= i {
		return s[:i]
	}
	return s
}
