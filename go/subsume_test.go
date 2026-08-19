/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"testing"
)

// The no-rule fold at the walk's tail (subsume.go subsumeNode): total
// in practice for every evaluated former, so unreachable through
// Subsume — pinned directly, with a nil, which also pins the "a nil
// folds to undecided" claim the walk's top comment makes. The TS port
// pins the same fold in ts/test/coverage3.test.ts
// (subsume-no-rule-fold).
func TestSubsumeNoRuleFold(t *testing.T) {
	st := &subState{
		profile:     "values",
		generalURL:  "general",
		specificURL: "specific",
	}
	out := subsumeNode(st, nil, newNil("test"), newNil("test"))
	if subUndecided != out {
		t.Fatalf("expected undecided, got %q", out)
	}
	if 1 != len(st.findings) {
		t.Fatalf("expected one finding, got %d", len(st.findings))
	}
	if "sub_unresolved" != st.findings[0].Code {
		t.Fatalf("expected sub_unresolved, got %q", st.findings[0].Code)
	}
}

// The unresolved-former classifier, arm by arm. Most arms cannot be
// reached through Subsume today (a bare reference or variable collects
// an error at load, so the query answers `error` first), but the
// classifier must still hold for each former, because trial walks and
// future callers hand it values load never sees. TS folds the same
// classification into one boolean expression (ts/src/subsume.ts
// `unresolved`), which V8 branch coverage pins there.
func TestSubsumeUnresolvedVal(t *testing.T) {
	for _, tc := range []struct {
		name string
		v    Val
		want bool
	}{
		{"ref", &RefVal{}, true},
		{"var", &VarVal{}, true},
		{"conjunct", &ConjunctVal{}, true},
		{"expect", &ExpectVal{}, true},
		{"func", newFunc("upper", nil), true},
		{"plus-op", &PlusOpVal{}, true},
		{"constraint", &ConstraintVal{}, false},
		{"scalar", newInteger(1), false},
	} {
		if got := subUnresolvedVal(tc.v); tc.want != got {
			t.Fatalf("%s: expected %v, got %v", tc.name, tc.want, got)
		}
	}
}

// hasPathFunc over a residual's must predicates and count atom
// (mapval.go): the pending-argument walk is pinned by the shared
// spread-path-dependent rows, but a path function can also hide inside
// a must value or the sizing residual, which no evaluated document
// reaches today (a must's arguments resolve before the spread applies).
func TestSubsumeConstraintPathFunc(t *testing.T) {
	mustCv := &ConstraintVal{musts: []constraintMust{{v: newFunc("key", nil)}}}
	if !hasPathFunc(mustCv) {
		t.Fatal("expected a must holding key() to be path-dependent")
	}
	countCv := &ConstraintVal{count: &ConstraintVal{
		pending: &constraintPending{atom: "min", args: []Val{newFunc("key", nil)}},
	}}
	if !hasPathFunc(countCv) {
		t.Fatal("expected a count holding key() to be path-dependent")
	}
	plain := &ConstraintVal{musts: []constraintMust{{v: newInteger(1)}}}
	if hasPathFunc(plain) {
		t.Fatal("expected a plain must to not be path-dependent")
	}
}

// listView's child accessor answers nil for an index the list does not
// hold. subsumeBag only asks for present keys, so the miss arm is
// unreachable through Subsume — pinned directly, as the accessor's
// contract, not the walk's.
func TestSubsumeListViewChildMiss(t *testing.T) {
	lv := listView(newList([]Val{newInteger(1)}))
	if nil != lv.child("9") {
		t.Fatal("expected nil for an out-of-range index")
	}
	if v := lv.child("0"); nil == v {
		t.Fatal("expected the held element for index 0")
	} else if "1" != v.Canon() {
		t.Fatalf("expected 1, got %s", v.Canon())
	}
}

// PolicyCompat's spellings, exercised directly: the breaking verb
// lives in another package, so its runs do not count here, and the
// reader's arms are this package's own contract (the TS twin exercises
// them through the verb — ts/test/cli.test.ts breaking-policy-*).
func TestPolicyCompat(t *testing.T) {
	for _, tc := range []struct {
		name string
		src  string
		want string
	}{
		{"pref", "aontu_policy: hide({compat: *none|backward|forward|full})\na:1", "none"},
		{"no-pref-first", "aontu_policy: hide({compat: none|backward})\na:1", "none"},
		{"bare", "aontu_policy: hide({compat: forward})\na:1", "forward"},
		{"not-string", "aontu_policy: hide({compat: 1})\na:1", ""},
		{"not-a-mode", "aontu_policy: hide({compat: sideways})\na:1", ""},
		{"no-compat-key", "aontu_policy: hide({other: 1})\na:1", ""},
		{"no-policy-key", "a:1", ""},
		{"scalar-root", "5", ""},
		{"broken", "a:1 a:2", ""},
	} {
		if got := PolicyCompat(tc.src, ""); tc.want != got {
			t.Fatalf("%s: expected %q, got %q", tc.name, tc.want, got)
		}
	}
}
