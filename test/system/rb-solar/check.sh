#!/usr/bin/env bash
# rb-solar --- the Solar System API and a human UI over it, generated
# from one model by `aontu render` and held to the REFERENCE's own
# validation.
#
#   ./check.sh
#
# Runnable from any cwd. Honours $AONTU (the engine command; default
# the TypeScript CLI in this repository), so the Go port runs the same
# check. The Ruby toolchain is skipped with a note when it is absent,
# rather than failing: the render half of the check runs anywhere.

set -u

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DIR/../../.." && pwd)"
AONTU="${AONTU:-node $ROOT/ts/bin/aontu.js}"
WORK="$DIR/work"
PORT="${RB_SOLAR_PORT:-8901}"

rm -rf "$WORK"
mkdir -p "$WORK"

n=0
fails=0
server_pid=""

cleanup() {
  if [ -n "$server_pid" ]; then
    kill "$server_pid" 2>/dev/null
    wait "$server_pid" 2>/dev/null
  fi
}
trap cleanup EXIT

ok() { n=$((n + 1)); echo "ok $n - $1"; }
fail() { n=$((n + 1)); fails=$((fails + 1)); echo "not ok $n - $1"; }
skip() { n=$((n + 1)); echo "ok $n - $1 # SKIP"; }

# --- the generators --------------------------------------------------
#
# Each is a file in the language it generates, and `render --check`
# holds what it renders against the tree committed under `app/`. A
# change to the model or a generator is a reviewable diff to `app/`; a
# hand edit to a generated file is drift the check reports.

RUBY_GENS="routes migrate seeds model api_base api_controller ui_controller"

drift=""
for g in $RUBY_GENS; do
  $AONTU render --check "$DIR/app" "$DIR/gen/$g.rb" >/dev/null 2>&1 \
    || drift="$drift $g.rb"
done
$AONTU render --check "$DIR/app" "$DIR/gen/views.aon" >/dev/null 2>&1 \
  || drift="$drift views.aon"
if [ -z "$drift" ]; then
  ok "every generator renders the committed app, byte for byte"
else
  fail "the committed app is not what the generators render:$drift"
fi

# --- the generators are files in their own languages -----------------
#
# The template surface's whole claim: a generator stays valid in the
# language it generates, so its compiler parses it and an editor
# highlights it.

if command -v ruby >/dev/null 2>&1; then
  bad=""
  for g in $RUBY_GENS; do
    ruby -c "$DIR/gen/$g.rb" >/dev/null 2>&1 || bad="$bad $g.rb"
  done
  if [ -z "$bad" ]; then
    ok "all seven Ruby generators parse as Ruby (ruby -c)"
  else
    fail "a generator is not valid Ruby:$bad"
  fi
else
  skip "the Ruby generators parse as Ruby (no ruby)"
fi

bad=""
for g in $RUBY_GENS; do
  $AONTU template --check "$DIR/gen/$g.rb" >/dev/null 2>&1 || bad="$bad $g.rb"
done
$AONTU template --check --marker '%%-' "$DIR/gen/erd.mmd" >/dev/null 2>&1 \
  || bad="$bad erd.mmd"
if [ -z "$bad" ]; then
  ok "every template-surface generator round-trips as a fixpoint"
else
  fail "a generator is not what the round trip answers:$bad"
fi

# --- the diagrams ----------------------------------------------------
#
# Drawn from the same model: the ER diagram by `render`, the trees and
# the value lattice by `view`. Pinned, so a model change that alters
# the shape shows up as a diff rather than as a stale picture.

$AONTU render --marker '%%-' --check "$DIR/doc" "$DIR/gen/erd.mmd" >/dev/null 2>&1 \
  && ok "the entity-relationship diagram is what the model renders" \
  || fail "doc/erd.mmd is stale"

pinned=1
$AONTU view doc --depth 2 --out "$DIR/doc/model-tree.txt" --check "$DIR/model.aon" >/dev/null 2>&1 || pinned=0
$AONTU view doc --depth 2 --as svg --out "$DIR/doc/model-tree.svg" --check "$DIR/model.aon" >/dev/null 2>&1 || pinned=0
$AONTU view doc --depth 2 --at '$.entity.0' --out "$DIR/doc/planet-tree.txt" --check "$DIR/model.aon" >/dev/null 2>&1 || pinned=0
$AONTU view doc --depth 2 --at '$.entity.0' --as svg --out "$DIR/doc/planet-tree.svg" --check "$DIR/model.aon" >/dev/null 2>&1 || pinned=0
$AONTU view lattice --out "$DIR/doc/value-lattice.txt" --check "$DIR/model.aon" >/dev/null 2>&1 || pinned=0
$AONTU view lattice --as svg --out "$DIR/doc/value-lattice.svg" --check "$DIR/model.aon" >/dev/null 2>&1 || pinned=0
[ "$pinned" = 1 ] \
  && ok "the model's trees and its value lattice draw and are pinned, text and SVG" \
  || fail "a view diagram is stale"

# --- what the model states and no file uses --------------------------
#
# Coverage over the MODEL, not over the code: a field added and
# forgotten is named here rather than left to rot.
#
# `--coverage` measures ONE document's reads, and this model is read by
# eight of them -- `$.error` is dead to the controller generator and
# alive to the base one. So the measure that means anything is the
# INTERSECTION: a path no generator read at all. Each generator's dead
# set is written out, and a path present in every one of them is dead
# for the system.

gens=0
: > "$WORK/dead.all"
for g in $RUBY_GENS erd views; do
  case "$g" in
    erd) src="$DIR/gen/erd.mmd"; extra="--marker %%-" ;;
    views) src="$DIR/gen/views.aon"; extra="" ;;
    *) src="$DIR/gen/$g.rb"; extra="" ;;
  esac
  $AONTU render --coverage $extra "$src" 2>/dev/null \
    | grep "^dead: " | sed "s/^dead: //" | sort -u > "$WORK/dead.$g"
  cat "$WORK/dead.$g" >> "$WORK/dead.all"
  gens=$((gens + 1))
done

# A path that appears once per generator is dead in all of them.
sort "$WORK/dead.all" | uniq -c \
  | awk -v n="$gens" '$1 == n { print $2 }' > "$WORK/dead.everywhere"

if [ ! -s "$WORK/dead.everywhere" ]; then
  ok "no path of the model is dead to all $gens generators"
else
  fail "the model states what nothing reads: $(tr "\n" " " < "$WORK/dead.everywhere")"
fi

# --- the model is in the agreed form ---------------------------------

$AONTU fmt --check "$DIR/model.aon" >/dev/null 2>&1 \
  && ok "the model is in the agreed form (aontu fmt)" \
  || fail "model.aon is not formatted"

# --- the system boots and the reference validates it -----------------

if ! command -v ruby >/dev/null 2>&1; then
  skip "the app boots, and the reference's 20 tests pass against it (no ruby)"
  skip "the human pages answer (no ruby)"
elif ! (cd "$DIR/app" && bundle check >/dev/null 2>&1); then
  skip "the app boots, and the reference's 20 tests pass against it (run bundle install in app/)"
  skip "the human pages answer (no bundle)"
else
  export RAILS_ENV=development

  # A SERVER LEFT OVER FROM A PREVIOUS RUN would answer instead of this
  # one, from whatever state that run left behind -- the validation
  # would then be reading a database this check never built. Found the
  # hard way: four tests failed against a stale server holding the
  # results of an earlier validation run.
  if curl -fsS -o /dev/null "http://127.0.0.1:$PORT/api/planet" 2>/dev/null; then
    fail "something is already answering on port $PORT; stop it, or set RB_SOLAR_PORT"
    echo
    echo "$fails of $n checks failed"
    exit 1
  fi

  (cd "$DIR/app" && bin/rails db:reset >"$WORK/db.log" 2>&1)
  if [ $? -ne 0 ]; then
    fail "the database would not build (see work/db.log)"
  else
    (cd "$DIR/app" && bin/rails server -p "$PORT" -b 127.0.0.1 >"$WORK/server.log" 2>&1) &
    server_pid=$!

    up=0
    for _ in $(seq 1 40); do
      if curl -fsS -o /dev/null "http://127.0.0.1:$PORT/api/planet" 2>/dev/null; then
        up=1
        break
      fi
      sleep 1
    done

    if [ "$up" != 1 ]; then
      fail "the app did not come up on port $PORT (see work/server.log)"
      skip "the human pages answer (no server)"
    else
      # THE REFERENCE'S OWN SCRIPT, unmodified, over HTTP. It takes a
      # base URL and speaks the API, which is what makes it usable
      # against an implementation in another language entirely.
      if VALIDATE_BASE_URL="http://127.0.0.1:$PORT" \
         node "$DIR/ref/validate.ts" >"$WORK/validate.out" 2>&1; then
        ok "the reference's 20 validation tests pass against the generated app"
      else
        fail "the reference's validation failed (see work/validate.out)"
      fi

      # The human side of the same data.
      pages=1
      for u in / /planets/earth /planets/earth/moons /planets/earth/moons/luna; do
        code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT$u")"
        [ "$code" = 200 ] || { pages=0; echo "#   $u answered $code"; }
      done
      curl -s "http://127.0.0.1:$PORT/planets/earth" | grep -q "<h1>Earth</h1>" || pages=0
      curl -s "http://127.0.0.1:$PORT/planets/earth" | grep -q "moons/luna" || pages=0
      [ "$pages" = 1 ] \
        && ok "the human pages answer, and a planet's page links to its moons" \
        || fail "a human page did not answer as expected"
    fi
  fi
fi

echo
if [ "$fails" = 0 ]; then
  echo "all $n checks passed"
  rm -rf "$WORK"
  exit 0
fi
echo "$fails of $n checks failed"
exit 1
