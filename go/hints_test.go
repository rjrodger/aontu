/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"fmt"
	"strings"
	"testing"
)

// The budget_passes message substring and class. Since issue #26
// closed (Go defers ref chains one link per pass, like TS), the
// 10-link reproducer is pinned by SHARED rows (budget.tsv
// budget-chain-*); this test keeps the hint-table and class guards as
// the fast local twin of ts/test/unify.test.ts.
func TestBudgetPassesHint(t *testing.T) {
	hint, ok := hints["budget_passes"]
	if !ok {
		t.Fatalf("budget_passes has no hint")
	}
	if !strings.Contains(hint, "evaluation budget") {
		t.Fatalf("budget_passes hint must contain %q, got: %s", "evaluation budget", hint)
	}
	if cls := codeClass("budget_passes"); cls != "budget" {
		t.Fatalf("budget_passes class: want budget, got %s", cls)
	}
	if cls := codeClass("path_cycle"); cls != "reference" {
		t.Fatalf("path_cycle class: want reference, got %s", cls)
	}
	// The prefix families resolve through their registered prefix, and
	// an unregistered code is an engine defect, classified internal.
	if cls := codeClass("func:upper"); cls != "conflict" {
		t.Fatalf("func:upper class: want conflict, got %s", cls)
	}
	if cls := codeClass("no-such-code"); cls != "internal" {
		t.Fatalf("unregistered code class: want internal, got %s", cls)
	}
}

// Check surfaces context-recorded errors that never land in the tree
// (the ctx-err union in CheckVars) — proven here with a unify-time
// error that is reachable in Go.
func TestCheckSurfacesCtxErrors(t *testing.T) {
	a := New()
	probs := a.Check("a:$.b b:$.a")
	if len(probs) == 0 {
		t.Fatalf("expected problems for mutual cycle")
	}
	found := false
	for _, p := range probs {
		if p.Why == "path_cycle" {
			found = true
			if p.Class != "reference" {
				t.Fatalf("path_cycle Problem.Class: want reference, got %s", p.Class)
			}
		}
	}
	if !found {
		t.Fatalf("expected a path_cycle problem, got: %+v", probs)
	}
}

// The plain-ref cycle chase has NO hop cap: a cycle of any length is
// proven at the first repetition (the seen set grows every hop and the
// tree is finite). Regression for the removed 99-hop cutoff. The TS
// twin is long-ref-cycle-is-proven in ts/test/unify.test.ts.
func TestLongRefCycleIsProven(t *testing.T) {
	var keys []string
	for i := 0; i < 120; i++ {
		keys = append(keys, fmt.Sprintf("k%03d", i))
	}
	var parts []string
	for i, k := range keys {
		parts = append(parts, fmt.Sprintf("%s:$.%s", k, keys[(i+1)%len(keys)]))
	}
	_, err := New().Generate(strings.Join(parts, " "))
	if err == nil {
		t.Fatalf("expected path_cycle error, generate succeeded")
	}
	ae, ok := err.(*AontuError)
	if !ok || ae.Code != "path_cycle" {
		t.Fatalf("expected code path_cycle, got %T %v", err, err)
	}
}

// TestFullMessageTwin asserts the FULL thrown-message literal -- marker,
// headline, verbatim hint, and both ANSI-coloured source frames --
// byte-for-byte. The TS twin with the SAME literal is
// full-message-twin in ts/test/error.test.ts, so a change to either
// port's rendering fails that side loudly. This is the completion pin
// of issue #29: thrown error text is in cross-port parity. (Spec rows
// still assert only probed substrings -- the twins are the byte-level
// guard.)
// TestFullMessageTwinFramed is the twin above with the two things its
// one-line source could not show: a conflict BELOW row 1, so the
// frame's two lines of leading context are rendered, and a multi-byte
// character before the column, so the column is counted in UTF-16 code
// units rather than bytes. Go got both wrong until the validation
// verb's byte-parity probing found them (G2 phase 4) -- the existing
// twin stayed green throughout, which is exactly why this one exists.
// The TS twin with the SAME literal is full-message-twin-framed in
// ts/test/error.test.ts.
func TestFullMessageTwinFramed(t *testing.T) {
	_, err := New().Generate("x: 0\ny: 0\n\"\u00e9\": 1\n\"\u00e9\": 2\nz: 0\n")
	if err == nil {
		t.Fatalf("expected error")
	}
	want := "[aontu/scalar_value]: Cannot unify values at path $.é\n\nLiteral scalar values of the same kind can only unify if they are\nexactly equal.\n \nExamples:\n  1 & 1   -> 1    # Does unify (equal Integers);\n  a & a   -> a    # Does unify (equal Strings);\n  1 & 2   -> nil  # Does not unify (unequal Integers);\n  1 & 1.0 -> nil  # Does not unify (kinds: Integer & Float).\n\n Cannot unify value: 2 with value: 1\n  \u001b[34m--> <no-file>:4:6\n\u001b[34m  2 | \u001b[0my: 0\n\u001b[34m  3 | \u001b[0m\"é\": 1\n\u001b[34m  4 | \u001b[0m\"é\": 2\n           \u001b[34m^ value was: 2\u001b[0m\n\u001b[34m  5 | \u001b[0mz: 0\n\u001b[34m  6 | \u001b[0m\n\n Cannot unify value: 1 with value: 2\n  \u001b[34m--> <no-file>:3:6\n\u001b[34m  1 | \u001b[0mx: 0\n\u001b[34m  2 | \u001b[0my: 0\n\u001b[34m  3 | \u001b[0m\"é\": 1\n           \u001b[34m^ value was: 1\u001b[0m\n\u001b[34m  4 | \u001b[0m\"é\": 2\n\u001b[34m  5 | \u001b[0mz: 0\n"
	if got := err.Error(); got != want {
		t.Fatalf("full message mismatch\n want: %q\n got:  %q", want, got)
	}
}

// TestFrameGutterWidth pins the excerpt gutter: two spaces, then the
// line number RIGHT-ALIGNED to the widest number the frame shows, which
// is always the value's row plus two. A FIXED three-wide field agreed
// with TypeScript only while every shown number had one digit, so from
// row eight upward the two ports printed the same error with differently
// indented excerpts -- and the caret, whose indent is the gutter's own
// width, moved with it. Both literals below are the CANONICAL port's
// output; the TS twin with the same literals is frame-gutter-width in
// ts/test/error.test.ts.
func TestFrameGutterWidth(t *testing.T) {
	for _, c := range []struct {
		name string
		rows int
		want string
	}{
		{"two-digit", 10, "[aontu/scalar_kind]: Cannot unify values at path $.bad\n\nLiteral scalar values of different kinds cannot unify.\n \nExamples:\n  1 & 1   -> 1    # Does unify (equal Integers);\n  1 & a   -> nil  # Does not unify (Kinds: Integer & String);\n  1 & 1.0 -> nil  # Does not unify (kinds: Integer & Float).\n\n Cannot unify value: true with value: 1\n  \u001b[34m--> <no-file>:10:10\n\u001b[34m   8 | \u001b[0m\n\u001b[34m   9 | \u001b[0m\n\u001b[34m  10 | \u001b[0mbad: 1 & true\n                \u001b[34m^ value was: true\u001b[0m\n\u001b[34m  11 | \u001b[0m\n\u001b[34m  12 | \u001b[0m\n\n Cannot unify value: 1 with value: true\n  \u001b[34m--> <no-file>:10:6\n\u001b[34m   8 | \u001b[0m\n\u001b[34m   9 | \u001b[0m\n\u001b[34m  10 | \u001b[0mbad: 1 & true\n            \u001b[34m^ value was: 1\u001b[0m\n\u001b[34m  11 | \u001b[0m\n\u001b[34m  12 | \u001b[0m\n"},
		{"three-digit", 98, "[aontu/scalar_kind]: Cannot unify values at path $.bad\n\nLiteral scalar values of different kinds cannot unify.\n \nExamples:\n  1 & 1   -> 1    # Does unify (equal Integers);\n  1 & a   -> nil  # Does not unify (Kinds: Integer & String);\n  1 & 1.0 -> nil  # Does not unify (kinds: Integer & Float).\n\n Cannot unify value: true with value: 1\n  \u001b[34m--> <no-file>:98:10\n\u001b[34m   96 | \u001b[0m\n\u001b[34m   97 | \u001b[0m\n\u001b[34m   98 | \u001b[0mbad: 1 & true\n                 \u001b[34m^ value was: true\u001b[0m\n\u001b[34m   99 | \u001b[0m\n\u001b[34m  100 | \u001b[0m\n\n Cannot unify value: 1 with value: true\n  \u001b[34m--> <no-file>:98:6\n\u001b[34m   96 | \u001b[0m\n\u001b[34m   97 | \u001b[0m\n\u001b[34m   98 | \u001b[0mbad: 1 & true\n             \u001b[34m^ value was: 1\u001b[0m\n\u001b[34m   99 | \u001b[0m\n\u001b[34m  100 | \u001b[0m\n"},
	} {
		_, err := New().Generate(strings.Repeat("\n", c.rows-1) + "bad: 1 & true\n")
		if err == nil {
			t.Fatalf("%s: expected error", c.name)
		}
		if got := err.Error(); got != c.want {
			t.Fatalf("%s: full message mismatch\n want: %q\n got:  %q",
				c.name, c.want, got)
		}
	}
}

func TestFullMessageTwin(t *testing.T) {
	_, err := New().Generate("a:1 a:2")
	if err == nil {
		t.Fatalf("expected error")
	}
	want := "[aontu/scalar_value]: Cannot unify values at path $.a\n\nLiteral scalar values of the same kind can only unify if they are\nexactly equal.\n \nExamples:\n  1 & 1   -> 1    # Does unify (equal Integers);\n  a & a   -> a    # Does unify (equal Strings);\n  1 & 2   -> nil  # Does not unify (unequal Integers);\n  1 & 1.0 -> nil  # Does not unify (kinds: Integer & Float).\n\n Cannot unify value: 2 with value: 1\n  \u001b[34m--> <no-file>:1:7\n\u001b[34m  1 | \u001b[0ma:1 a:2\n            \u001b[34m^ value was: 2\u001b[0m\n\u001b[34m  2 | \u001b[0m\n\u001b[34m  3 | \u001b[0m\n\n Cannot unify value: 1 with value: 2\n  \u001b[34m--> <no-file>:1:3\n\u001b[34m  1 | \u001b[0ma:1 a:2\n        \u001b[34m^ value was: 1\u001b[0m\n\u001b[34m  2 | \u001b[0m\n\u001b[34m  3 | \u001b[0m\n"
	if got := err.Error(); got != want {
		t.Fatalf("full message mismatch\n want: %q\n got:  %q", want, got)
	}
}

// TestFullMessageBagTwin is the bag-operand twin (issue #34): a map
// operand carries its real source position (its `{`), so it wins the
// later-in-source primary rule and its frame points at column 7 --
// byte-identical with full-message-bag-twin in ts/test/error.test.ts.
// Before the parse recorded map/list positions, the MapVal read as
// position 0: the frame said 1:1 and the operand order flipped.
// TestFullMessageSpreadTwin is the twin of full-message-spread-twin in
// ts/test/error.test.ts (issue #63): a spread-applied constraint that
// the child's value refuses renders its two frames VALUE FIRST, the
// later term in the source being the primary. This port emitted them
// reversed, because makeNilErr compared a synthetic source id that put
// a CLONE -- which every applied spread template is -- in a different
// bucket from a parsed value, so the two were never ordered by
// position at all. TS compares the site url, which a clone inherits.
func TestFullMessageSpreadTwin(t *testing.T) {
	a := New()
	_, err := a.Generate("a:&:min(3) a:{x:2}")
	if nil == err {
		t.Fatalf("expected error")
	}
	want := "[aontu/constraint]: Cannot unify values at path $.a.x\n\nThis value does not satisfy the constraint. A constraint is the\nmeet of bound atoms (min, max, above, below) and exclusions (neq)\nover one domain; the expected form shown is the normalised\nresidual the value must satisfy.\n \nExamples:\n  min(0) & 3                    -> 3    # Admitted (3 >= 0);\n  min(0) & 0d5                  -> 0d5  # Bounds are leaf-agnostic;\n  max(65535) & 99999            -> nil  # Above the bound;\n  min(5) & max(3)               -> nil  # Empty at composition time;\n  integer & above(1) & below(2) -> nil  # No integer in the gap;\n  neq(1) & 1.0                  -> 1.0  # neq excludes leaf AND value.\n  re(\"^a\") & \"abc\"              -> \"abc\" # Patterns are unanchored.\n\n Cannot unify value: 2 with value: min(3)\n  \u001b[34m--> <no-file>:1:17\n\u001b[34m  1 | \u001b[0ma:&:min(3) a:{x:2}\n                      \u001b[34m^ value was: 2\u001b[0m\n\u001b[34m  2 | \u001b[0m\n\u001b[34m  3 | \u001b[0m\n\n Cannot unify value: min(3) with value: 2\n  \u001b[34m--> <no-file>:1:5\n\u001b[34m  1 | \u001b[0ma:&:min(3) a:{x:2}\n          \u001b[34m^ value was: min(3)\u001b[0m\n\u001b[34m  2 | \u001b[0m\n\u001b[34m  3 | \u001b[0m\n"
	if err.Error() != want {
		t.Fatalf("full message twin mismatch:\n got: %q\nwant: %q", err.Error(), want)
	}
}

func TestFullMessageBagTwin(t *testing.T) {
	_, err := New().Generate("a:1 a:{b:1}")
	if err == nil {
		t.Fatalf("expected error")
	}
	want := "[aontu/scalar_kind]: Cannot unify values at path $.a\n\nLiteral scalar values of different kinds cannot unify.\n \nExamples:\n  1 & 1   -> 1    # Does unify (equal Integers);\n  1 & a   -> nil  # Does not unify (Kinds: Integer & String);\n  1 & 1.0 -> nil  # Does not unify (kinds: Integer & Float).\n\n Cannot unify value: {\"b\":1} with value: 1\n  \u001b[34m--> <no-file>:1:7\n\u001b[34m  1 | \u001b[0ma:1 a:{b:1}\n            \u001b[34m^ value was: {\"b\":1}\u001b[0m\n\u001b[34m  2 | \u001b[0m\n\u001b[34m  3 | \u001b[0m\n\n Cannot unify value: 1 with value: {\"b\":1}\n  \u001b[34m--> <no-file>:1:3\n\u001b[34m  1 | \u001b[0ma:1 a:{b:1}\n        \u001b[34m^ value was: 1\u001b[0m\n\u001b[34m  2 | \u001b[0m\n\u001b[34m  3 | \u001b[0m\n"
	if got := err.Error(); got != want {
		t.Fatalf("bag twin mismatch\n want: %q\n got:  %q", want, got)
	}
}

// TestFuncResidueFrame is the func-residue-frame twin in ts/test/error.test.ts.
// A function that resolves to a FRESH value (`super(1)` answers a new
// ScalarKindVal) must hand its own SITE to that value, or the residue --
// and any conjunct built over it, which takes its site from its first
// term -- has no position, and the frame points at the start of the
// source instead of at the call (issue #41).
func TestFuncResidueFrame(t *testing.T) {
	_, err := New().Generate("a:super(1)&integer")
	if err == nil {
		t.Fatalf("expected error")
	}
	want := "[aontu/mapval_no_gen]: Cannot resolve value at path $.a\n\nThis value was present after unification, and cannot be generated\nbecause it is not a literal value.\n\n Cannot resolve value: integer\n  \u001b[34m--> <no-file>:1:3\n\u001b[34m  1 | \u001b[0ma:super(1)&integer\n        \u001b[34m^ key a value was: integer\u001b[0m\n\u001b[34m  2 | \u001b[0m\n\u001b[34m  3 | \u001b[0m\n"
	if got := err.Error(); got != want {
		t.Fatalf("func-residue-frame mismatch\n want: %q\n got:  %q", want, got)
	}
}

// TestOperandlessNilFrame is the operandless-nil-frame twin in ts/test/error.test.ts.
// A nil raised about a CONSTRUCT rather than a failed meet has no
// operands, and still gets a located frame rendered about ITSELF, plus
// the path where it sits. Reading both from the absent primary put every
// such error at `$` with no frame at all (issue #39). The two blank lines
// before the frame are TS's spacing for a code that carries no hint.
func TestOperandlessNilFrame(t *testing.T) {
	_, err := New().Generate("a:-0x_1")
	if err == nil {
		t.Fatalf("expected error")
	}
	want := "[aontu/negative]: Cannot resolve value at path $.a\n\n\n Cannot resolve value: nil\n  \u001b[34m--> <no-file>:1:3\n\u001b[34m  1 | \u001b[0ma:-0x_1\n        \u001b[34m^ value was: nil\u001b[0m\n\u001b[34m  2 | \u001b[0m\n\u001b[34m  3 | \u001b[0m\n"
	if got := err.Error(); got != want {
		t.Fatalf("operandless-nil-frame mismatch\n want: %q\n got:  %q", want, got)
	}
}

// TestHintTrailingNewlineFrame is the hint-trailing-newline-frame twin in ts/test/error.test.ts.
// `no_path` is the one hint whose text ends in a newline. That newline is
// not extra spacing -- TS's closing `\n\n` -> `\n` pass absorbs it into
// the single blank line before the frame -- so Go must trim it or the
// message gains a blank line TS does not have (issue #39).
func TestHintTrailingNewlineFrame(t *testing.T) {
	_, err := New().Generate("a:{b?:$.zz9} c:1")
	if err == nil {
		t.Fatalf("expected error")
	}
	want := "[aontu/no_path]: Cannot resolve value at path $.a.b\n\nThe path reference could not be found.\n \nExamples:\n  a:1 b:$.a  -> a:1,b:1  # $.a is a valid path reference as a is a key of root ($).\n  a:$.b      -> nil      # $.b is not a valid path reference as there is no key b in root ($).\n\n Cannot resolve value: $.zz9\n  \u001b[34m--> <no-file>:1:7\n\u001b[34m  1 | \u001b[0ma:{b?:$.zz9} c:1\n            \u001b[34m^ value was: $.zz9\u001b[0m\n\u001b[34m  2 | \u001b[0m\n\u001b[34m  3 | \u001b[0m\n"
	if got := err.Error(); got != want {
		t.Fatalf("hint-trailing-newline-frame mismatch\n want: %q\n got:  %q", want, got)
	}
}

// TestListIndexZeroPath is the list-index-zero-path twin in ts/test/error.test.ts.
// The list index 0 SURVIVES into the headline path. TS filtered path
// segments with `” != p`, and `” != 0` is false in JavaScript, so the
// index a reader is most likely to meet was the one silently erased,
// while `$.a.1` came through (issue #37).
func TestListIndexZeroPath(t *testing.T) {
	_, err := New().Generate("a:[1]&[2]")
	if err == nil {
		t.Fatalf("expected error")
	}
	want := "[aontu/scalar_value]: Cannot unify values at path $.a.0\n\nLiteral scalar values of the same kind can only unify if they are\nexactly equal.\n \nExamples:\n  1 & 1   -> 1    # Does unify (equal Integers);\n  a & a   -> a    # Does unify (equal Strings);\n  1 & 2   -> nil  # Does not unify (unequal Integers);\n  1 & 1.0 -> nil  # Does not unify (kinds: Integer & Float).\n\n Cannot unify value: 2 with value: 1\n  \u001b[34m--> <no-file>:1:8\n\u001b[34m  1 | \u001b[0ma:[1]&[2]\n             \u001b[34m^ value was: 2\u001b[0m\n\u001b[34m  2 | \u001b[0m\n\u001b[34m  3 | \u001b[0m\n\n Cannot unify value: 1 with value: 2\n  \u001b[34m--> <no-file>:1:4\n\u001b[34m  1 | \u001b[0ma:[1]&[2]\n         \u001b[34m^ value was: 1\u001b[0m\n\u001b[34m  2 | \u001b[0m\n\u001b[34m  3 | \u001b[0m\n"
	if got := err.Error(); got != want {
		t.Fatalf("list-index-zero-path mismatch\n want: %q\n got:  %q", want, got)
	}
}

// TestMergeConflictCRLF is the merge-conflict-crlf twin in
// ts/test/error.test.ts (issue #5).
//
// The \r sits on the end of the line and is not part of the marker run,
// so it has to come off before the length is counted -- otherwise
// "=======\r" is eight characters and the marker goes unnoticed on every
// Windows checkout, which is exactly where an unresolved merge is most
// likely to be sitting.
//
// Not a shared spec row: the spec's src column escapes \n, \t and \\, and
// has no spelling for a carriage return.
func TestMergeConflictCRLF(t *testing.T) {
	_, err := New().Generate("<<<<<<< HEAD\r\na:1\r\n=======\r\na:2\r\n>>>>>>> other\r\n")
	if err == nil {
		t.Fatalf("expected error")
	}
	ae, ok := err.(*AontuError)
	if !ok || ae.Code != "merge_conflict" {
		t.Fatalf("crlf marker: %v", err)
	}

	// ... and a bare CRLF line ending is still not a marker line.
	out, err := New().Generate("a:1\r\nb:2\r\n")
	if err != nil {
		t.Fatalf("crlf plain: %v", err)
	}
	m, _ := out.(map[string]any)
	if m == nil || m["a"] == nil || m["b"] == nil {
		t.Fatalf("crlf plain: %v", out)
	}
}

// THE EXPLAIN SURFACE (G11 phase 3). The verb in cmd/aontu is a thin
// projection of these two, but coverage is measured per package, so
// the engine's own exports need the engine's own cases. What they
// assert is the CONTRACT the verb rests on: the registry is the list,
// a registered code always resolves, a dynamic code resolves through
// the prefix it extends, and nothing outside the registry does.
func TestExplainCode(t *testing.T) {
	// A registered code with text.
	class, hint, registered := ExplainCode("no_scalar_unify")
	if !registered || "conflict" != class || "" == hint {
		t.Fatalf("no_scalar_unify: %q %q %v", class, hint, registered)
	}

	// A registered code WITHOUT text. The 27 of these are exactly what
	// the verb exists to make visible; before it, a missing hint could
	// only be met beside the error that raises it.
	class, hint, registered = ExplainCode("deprecated")
	if !registered || "" == class {
		t.Fatalf("deprecated: %q %q %v", class, hint, registered)
	}
	if "" != hint {
		t.Log("deprecated has gained a hint; the table is closing, which" +
			" is the work item G11 phase 3 created")
	}

	// A DYNAMIC CODE is registered through the prefix it extends and
	// carries that prefix's text: the suffix names the operator, the
	// explanation is the prefix's.
	class, hint, registered = ExplainCode("func:upper")
	if !registered || "conflict" != class || hints["func:"] != hint {
		t.Fatalf("func:upper: %q %q %v", class, hint, registered)
	}
	for _, code := range []string{"op:x", "op[+]", "var[x", "ref[y"} {
		if _, _, ok := ExplainCode(code); !ok {
			t.Errorf("%s does not resolve through its prefix", code)
		}
	}

	// An unregistered code is NOT registered, and still classifies --
	// which is what lets a caller be told it is unknown rather than
	// merely unexplained.
	class, hint, registered = ExplainCode("no-such-code")
	if registered || "internal" != class || "" != hint {
		t.Fatalf("no-such-code: %q %q %v", class, hint, registered)
	}

	// The empty code is the why-less nil, which classifies as its
	// eventual gen-time code, nil_gen -- stated as the RULE rather than
	// as nil_gen's current class, so this case pins the delegation and
	// not a constant that belongs to another table.
	if class, _, _ := ExplainCode(""); codeClass("nil_gen") != class {
		t.Fatalf("the empty code classifies as %q, not as nil_gen does", class)
	}
}

// Codes is the REGISTRY, sorted, so both ports list in one order. It
// is deliberately not the hint table: the registry is in cross-port
// parity and the hint tables are not.
func TestCodes(t *testing.T) {
	codes := Codes()
	if len(codeClasses) != len(codes) {
		t.Fatalf("Codes has %d entries, the registry %d",
			len(codes), len(codeClasses))
	}
	for i := 1; i < len(codes); i++ {
		if codes[i-1] >= codes[i] {
			t.Fatalf("Codes is not sorted at %d: %q then %q",
				i, codes[i-1], codes[i])
		}
	}
	for _, code := range codes {
		if _, _, registered := ExplainCode(code); !registered {
			t.Errorf("%s is listed and does not resolve", code)
		}
	}
	if len(hints) >= len(codes) {
		t.Logf("the hint table (%d) has caught up with the registry (%d)",
			len(hints), len(codes))
	}
}
