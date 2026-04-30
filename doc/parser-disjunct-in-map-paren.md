# Parser Issue: `|` and `&` operators inside `{...}` within function parens

## Problem

The `|` (disjunct) and `&` (conjunct) operators break out of map `{...}` boundaries when the map is inside function parentheses `(...)`.

```
type({x:*1|number})    # PARSE ERROR - | breaks the map
type(x:*1|number)      # OK - no inner braces
type({x:(*1|number)})  # OK - explicit parens around disjunct
({x:*1|number})        # PARSE ERROR - same issue in plain parens
{x:*1|number}          # OK - no outer parens
```

## Root Cause

The `@jsonic/expr` plugin manages operator activation using a paren depth counter (`n.expr_paren`). When inside function parens `(...)`, this counter is incremented, making `|` and `&` active as expression operators at all rule depths.

When `{...}` opens a map inside the parens, the jsonic rule depth (`r.d`) increases, but the Expr plugin's operator activation checks `0 === r.d || n.expr_paren > 0`. Since `expr_paren` is still positive, the `|` operator activates inside the map value, splitting `{x:*1` and `number}` as separate disjunct arms instead of treating `*1|number` as a value within the map.

The operator activation happens at the lex level before jsonic rules can intervene, so this cannot be fixed from `lang.ts` alone.

## Impact

Affects any disjunct (`|`) or conjunct (`&`) used inside a map literal within function parens:
- `type({x:*1|number})` - type function with pref+disjunct constraint
- `copy({a:1|2})` - copy with disjunct value
- `({x:1}&{y:2})` - conjunct inside plain parens (works at top level but not in parens)

## Workarounds

1. **Omit inner braces**: `type(x:*1|number)` — works because the map is implicit
2. **Wrap disjunct in explicit parens**: `type({x:(*1|number)})` — parens scope the `|`
3. **Use separate statements**: `a:type({x:number}), a:{x:*1|number}` — apply type and pref separately

## Fix Location

The fix needs to be in `@jsonic/expr` plugin (`node_modules/@jsonic/expr`). The operator activation logic should track map/list depth separately from paren depth, and deactivate `|`/`&` when the rule depth has increased due to a map/list open (not a paren open) since the last paren.

Specifically, the conditions at lines ~704 and ~717 of the Expr plugin:
```javascript
(0 === r.d || n.expr_paren > 0)
```
should also check that the current depth hasn't increased beyond the paren depth:
```javascript
(0 === r.d || (n.expr_paren > 0 && r.d <= expr_paren_depth))
```
where `expr_paren_depth` tracks the rule depth at which the paren opened.
