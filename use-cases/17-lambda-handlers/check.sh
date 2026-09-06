#!/usr/bin/env bash
# check.sh --- twelve Lambda handlers and their index, rendered from one
# model by one rule set written in the canonical form the template
# surface desugars to (docs/design/TEMPLATE.0.md D7). What this proves:
# a value reaches a handler through `replace`, with no hole syntax;
# `esc: sq` makes it safe in the single-quoted literal it lands in; a
# line is verbatim, so two lines of two spaces survive; a dispatch over
# an empty selection is the whole conditional; `form` keeps the model's
# order and closes the name-derivation chain; and both ports render the
# same bytes.
#
# Runnable from any cwd. `go` is optional -- the parity check skips
# with a note without it.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
REPO="$DIR/../.."
AONTU="${AONTU:-node $REPO/ts/bin/aontu.js}"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

pass=0
fail() { echo "FAIL: $1" >&2; exit 1; }
ok() { pass=$((pass + 1)); echo "ok $pass - $1"; }
skip() { pass=$((pass + 1)); echo "ok $pass - $1 # SKIP"; }

# run <name> <expected-exit> -- <cli args...>
# Captures stdout+stderr in $WORK/<name>.out, asserts the exit code.
run() {
  local name="$1" want="$2"; shift 3
  local got=0
  $AONTU "$@" >"$WORK/$name.out" 2>&1 || got=$?
  [ "$got" -eq "$want" ] \
    || { cat "$WORK/$name.out" >&2; fail "$name: exit $got, wanted $want"; }
}

# has <name> <fixed-string> -- the captured output must contain it.
has() {
  grep -qF -- "$2" "$WORK/$1.out" \
    || { cat "$WORK/$1.out" >&2; fail "$1: output does not contain: $2"; }
}

# ---------------------------------------------------------------------
# 1. THE GOLDENS ARE HELD BY --check: thirteen units, twelve handlers
# and the index, byte for byte, the DO-NOT-EDIT discipline of a
# generated tree.
run check 0 -- render --check "$DIR/expected" "$DIR/gen.aon"
[ "$(ls "$DIR/expected/handlers" | wc -l)" -eq 12 ] || fail "expected twelve handlers"
ok "twelve handlers and the index match their goldens byte for byte"

# 2. EVERY FILE PARSES AS TYPESCRIPT. The compiler itself over each
# file, asked for syntax alone (a TS1xxx diagnostic; the handlers
# import a module this case does not carry, and that is not a syntax
# question): a generator whose output merely looks right is one nobody
# trusts, and the escaping claim below is a claim about a parser.
"$REPO/ts/node_modules/.bin/tsc" --noEmit --skipLibCheck --target es2020 \
  --module commonjs "$DIR"/expected/handlers/*.ts "$DIR/expected/index.ts" \
  > "$WORK/tsc.out" 2>&1 || true
if grep -q "error TS1" "$WORK/tsc.out"; then
  cat "$WORK/tsc.out" >&2
  fail "a generated file has a TypeScript syntax error"
fi
ok "all thirteen files parse as TypeScript (tsc, no syntax diagnostic)"

# 3. ESCAPING IS ON. The chat service listens on a pin with an
# apostrophe, and `esc: sq` writes it as \' inside the single-quoted
# literal -- the line the compiler would otherwise reject.
grep -qF "pin:'sys:chat,user:o\\'brien'" "$DIR/expected/handlers/chat.ts" \
  || fail "the apostrophe pin is not escaped for the single-quoted literal"
ok "esc: sq escapes o'brien as o\\'brien inside the literal"

# 4. WHITESPACE IS VERBATIM: a line of two spaces is a line of two
# spaces, and a blank line is blank. No trim markers exist, because a
# marker line is never an output line.
[ "$(grep -c '^  $' "$DIR/expected/handlers/notify.ts")" -eq 2 ] \
  || fail "the two two-space lines did not survive"
[ "$(grep -c '^$' "$DIR/expected/handlers/notify.ts")" -eq 2 ] \
  || fail "the two blank lines did not survive"
ok "two two-space lines and two blank lines survive in a handler"

# 5. THE CONDITIONAL IS THE SELECTION. A service with no S3 events gets
# no gateway hook, because a dispatch over an empty filter emits
# nothing; one with an S3 event gets the hook; an SQS event is filtered
# out.
grep -qF "makeGatewayHandler('sys:ingest,cmd:file')" "$DIR/expected/handlers/ingest.ts" \
  || fail "the S3 hook is missing from ingest"
! grep -qF "makeGatewayHandler" "$DIR/expected/handlers/notify.ts" \
  || fail "notify has a gateway hook it should not have"
! grep -qF "cmd:queue" "$DIR/expected/handlers/index-build.ts" \
  || fail "the SQS event reached the S3 hook"
ok "the S3 hook appears exactly where the model has an S3 event"

# 6. THE INDEX IS IN THE MODEL'S ORDER, and the constants come out of
# the name-derivation chain: split on the hyphen, form each word
# upper, join with an underscore.
grep -qF "export const INDEX_BUILD = 'index-build'" "$DIR/expected/index.ts" \
  || fail "the chain did not spell INDEX_BUILD"
[ "$(head -1 "$DIR/expected/index.ts")" = "export const ADMIN = 'admin'" ] \
  || fail "the index does not start with admin"
[ "$(wc -l < "$DIR/expected/index.ts")" -eq 12 ] || fail "the index is not twelve lines"
ok "form keeps the order and join(form(split(...))) spells the constants"

# 7. THE TWO STATIC CHECKS refuse a drifted template before any node is
# visited: a key inside another, and a key the body does not hold.
run overlap 1 -- "$DIR/bad/overlap.aon"
has overlap '[aontu/replace_overlap]'
run unused 1 -- "$DIR/bad/unused.aon"
has unused '[aontu/replace_unused]'
ok "replace_overlap and replace_unused refuse the seeded templates"

# 8. --check IS RED WHEN A GOLDEN MOVES, and names the unit.
cp -r "$DIR/expected" "$WORK/moved"
printf '// edited by hand\n' >> "$WORK/moved/handlers/chat.ts"
run drift 1 -- render --check "$WORK/moved" "$DIR/gen.aon"
has drift 'handlers/chat.ts'
ok "--check is red when a handler is edited by hand, and names it"

# 9. THE TRACE AND THE COVERAGE REPORT (RENDER P7). Every line of every
# handler came from a rule, and the trace says which -- the `%handler`
# rule set by the name it was read through, and the service the
# dispatch matched, by its path in the model. Nothing here is dead
# model and no declaration is a hole: one model, wholly consumed, one
# output, wholly ruled.
$AONTU render --format json "$DIR/gen.aon" 2>/dev/null > "$WORK/trace.json" \
  || fail "the JSON report did not render"
python3 - "$WORK/trace.json" <<'PY_TRACE'
import json, sys
r = json.load(open(sys.argv[1]))
t = r["trace"]
assert 250 < len(t), len(t)
# Every entry names a unit that was rendered, and a rule.
units = set(u["path"] for u in r["units"])
assert all(e["unit"] in units for e in t)
assert all("#" in e["rule"] for e in t)
# The named rule set is addressed by its name; the twelve services are
# each matched at their own path in the model.
named = [e for e in t if e["rule"].startswith("$.%handler")]
assert 12 == len(set(e["node"] for e in named)), sorted(set(e["node"] for e in named))
assert "$.services.chat" in set(e["node"] for e in named)
# A table written inline at the call has no address of its own.
assert any("#0" == e["rule"] for e in t)
PY_TRACE
run cover 0 -- render --coverage "$DIR/gen.aon"
has cover 'coverage: 3 path(s) read, 0 no output consumed, 0 declaration(s)'
ok "the trace names the rule and the model node behind every piece, and nothing is dead"

# 10. THE TEMPLATE SURFACE (RENDER P8). handler.ts is the SAME
# generator written in the target's own syntax: the file IS a Lambda
# handler, and its marked lines are the aontu that turns one into
# twelve. It renders the same thirteen units against the same goldens,
# it parses as TypeScript with no syntax diagnostic, and the round trip
# between the two forms is a fixpoint.
run tmplrender 0 -- render --check "$DIR/expected" "$DIR/handler.ts"
run tmplcheck 0 -- template --check "$DIR/handler.ts"
$AONTU template "$DIR/handler.ts" > "$WORK/handler.aon" 2>/dev/null \
  || fail "the template did not desugar"
grep -q 'seneca.listen({type:.sqs.,pin:.PIN.})' "$WORK/handler.aon" \
  || fail "the canonical form lost a body line"
# The two lines that are two spaces and nothing else are output, and
# the canonical form quotes them so an editor that trims on save is
# caught (TEMPLATE.0.md D8).
[ "$(grep -c '^`  `$' "$WORK/handler.aon")" = "2" ] \
  || fail "the canonical form lost the two-space lines"
"$REPO/ts/node_modules/.bin/tsc" --noEmit --skipLibCheck --target es2020 \
  --module esnext --moduleResolution bundler "$DIR/handler.ts" 2>&1 \
  | grep -E 'error TS1[0-9]{3}' > "$WORK/tmpl-tsc.out" && {
    cat "$WORK/tmpl-tsc.out" >&2
    fail "the generator file does not parse as TypeScript"
  }
ok "the template form renders the same thirteen units, round-trips, and parses"

# 11. ADR-001: the Go port renders the same bytes, and refuses the same
# template.
if command -v go >/dev/null 2>&1; then
  GOBIN="$WORK/aontu-go"
  (cd "$REPO/go" && go build -o "$GOBIN" ./cmd/aontu) \
    || fail "could not build the Go CLI"
  "$GOBIN" render --check "$DIR/expected" "$DIR/gen.aon" 2>/dev/null \
    || fail "the Go port's render does not match the goldens (ADR-001)"
  "$GOBIN" "$DIR/bad/overlap.aon" >"$WORK/go-overlap.out" 2>&1 \
    && fail "the Go port accepted the overlapping keys" || true
  grep -qF '[aontu/replace_overlap]' "$WORK/go-overlap.out" \
    || fail "the Go port did not refuse replace_overlap"
  ok "the Go port renders the same thirteen units and refuses the same template"
  "$GOBIN" render --format json "$DIR/gen.aon" 2>/dev/null > "$WORK/trace-go.json" \
    || fail "the Go port's JSON report did not render"
  python3 - "$WORK/trace.json" "$WORK/trace-go.json" <<'PY_PARITY'
import json, sys
a = json.load(open(sys.argv[1]))["trace"]
b = json.load(open(sys.argv[2]))["trace"]
assert a == b, "the two ports disagree about the trace (ADR-001)"
PY_PARITY
  ok "the Go port records the same trace, entry for entry"
  "$GOBIN" render --check "$DIR/expected" "$DIR/handler.ts" 2>/dev/null \
    || fail "the Go port's render of the template form does not match the goldens"
  "$GOBIN" template --check "$DIR/handler.ts" \
    || fail "the Go port does not agree the round trip is a fixpoint"
  diff <("$GOBIN" template "$DIR/handler.ts") "$WORK/handler.aon" \
    || fail "the two ports desugar the template differently (ADR-001)"
  ok "the Go port desugars and renders the template form identically"
else
  skip "the Go port renders the same thirteen units (no go toolchain)"
  skip "the Go port records the same trace (no go toolchain)"
  skip "the Go port desugars the template form identically (no go toolchain)"
fi

echo

# THE MODEL TREE. The shape of this document, drawn by the one kind
# that reads no report: `view doc` walks the anchor, exactly as
# `get --keys --types` does, and stops at a depth that says how many
# keys it did not draw. The figure at the head of the README is this,
# and `--check` is the gate that keeps it true.
$AONTU view doc --depth 2 "$DIR/model.aon" > "$WORK/doc.out" 2>/dev/null \
  || fail "the model tree did not draw"
diff -u "$DIR/expected/diagram-doc.txt" "$WORK/doc.out" \
  || fail "the model tree drifted"
$AONTU view doc --depth 2 --out "$DIR/expected/diagram-doc.txt" --check \
  "$DIR/model.aon" >/dev/null 2>&1 || fail "the model tree golden is stale"
$AONTU view doc --depth 2 --as svg --out "$DIR/expected/diagram-doc.svg" \
  --check "$DIR/model.aon" >/dev/null 2>&1 || fail "the model tree SVG is stale"
ok "the model tree draws and is pinned, text and SVG"

echo "all $pass checks passed"
