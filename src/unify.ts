/* Copyright (c) 2021-2023 Richard Rodger, MIT License */


import type { Val } from './type'

import { AontuContext } from './ctx'

import { DONE } from './type'

import { makeNilErr } from './err'

import { NilVal } from './val/NilVal'
import { StringVal } from './val/StringVal'
import { PathVal } from './val/PathVal'
import { KeyFuncVal } from './val/KeyFuncVal'

import {
  Lang
} from './lang'


import {
  explainOpen, ec, explainClose,
} from './utility'


import {
  top
} from './val/top'



// TODO: FIX: false positive when too many top unifications
const MAXCYCLE = 9999

// Vals should only have to unify downwards (in .unify) over Vals they understand.
// and for complex Vals, TOP, which means self unify if not yet done
const unite = (ctx: AontuContext, a: any, b: any, whence: string) => {
  // Fast paths that don't recurse and so don't need cycle-detection:
  // short-circuit before the saw-key build and seen-map lookup (which
  // together cost ~2.5µs per call). Only return early when the result
  // is already `done` — a non-done result would need the trailing
  // top() unify below.
  //
  //   A6a: same ref, already done
  //   A6b: different ref but same id + both done
  //   P1:  exact-equal scalars that are already done (14% of calls
  //        in foo-sdk, ~100% with a.done=true)
  if (a !== undefined && a !== null) {
    if (a === b) {
      if (a.done) return a
    }
    else if (b !== undefined && b !== null) {
      if (a.done && b.done) {
        if (a.id === b.id) return a
        if (a.constructor === b.constructor && a.peg === b.peg
          && !a.isNil && !b.isNil
          && !a.isConjunct && !a.isDisjunct
          && !a.isPath && !a.isPref && !a.isFunc && !a.isExpect) {
          return a
        }

        // Id-keyed cache: reuse results for the exact same Val pair.
        const uc = ctx._uniteCache
        if (uc !== undefined) {
          const ucKey = a.id + '|' + b.id
          const ucHit = uc.get(ucKey)
          if (ucHit !== undefined) return ucHit
        }
      }
    }
  }

  const te = ctx.explain && explainOpen(ctx, ctx.explain, 'unite', a, b)

  let out = a
  let why = 'u'

  // Cycle-detection key. Use numeric path index for speed; fall back to
  // full string key when debug is enabled so the saw value is human-readable.
  let saw: string
  if (ctx.opts.debug) {
    saw = (a ? a.id + (a.done ? '' : '*') : '') + '~' +
      (b ? b.id + (b.done ? '' : '*') : '') + '@' + ctx.pathstr
  }
  else {
    saw = (a ? a.id + (a.done ? 'd' : '') : 0) + '~' +
      (b ? b.id + (b.done ? 'd' : '') : 0) + '~' + ctx.pathidx
  }

  // NOTE: if this error occurs "unreasonably", attemp to avoid unnecesary unification
  // See for example PrefVal peg.id equality inspection.
  const sawCount = ctx.seen.get(saw) ?? 0
  if (MAXCYCLE < sawCount) {
    // console.log('SAW', sawCount, saw, a?.id, a?.canon, b?.id, b?.canon, ctx.cc)
    out = makeNilErr(ctx, 'unify_cycle', a, b)
  }
  else {
    ctx.seen.set(saw, sawCount + 1)

    try {
      let unified = false

      // Dispatch ladder. Structure note:
      //   - `a == null` is degenerate (shouldn't happen in practice:
      //     the top-level call seeds with a real Val). Kept for safety.
      //   - TOP is the unit element: unifying with it returns the
      //     other side. Handle both sides.
      //   - Otherwise route by Val type. Complex Vals (Conjunct,
      //     Disjunct, Ref, Pref, Func, Expect) have their own unify
      //     that knows how to absorb the peer; prefer `a.unify` when
      //     `a` is complex, else `b.unify` when `b` is complex. If
      //     neither is complex and it's not a plain-scalar match, fall
      //     through to the generic `a.unify` (concrete Val classes
      //     each handle their own peer case).
      if (a == null) {
        out = b
        why = 'b'
      }
      else if (b == null || b.isTop) {
        out = a
        why = 'a'
      }
      else if (a.isTop) {
        out = b
        why = 'b'
      }
      else if (a.isNil) {
        out = update(a, b)
        why = 'an'
      }
      else if (b.isNil) {
        out = update(b, a)
        why = 'bn'
      }
      else if (a.isConjunct || a.isExpect || a.isSpread) {
        out = a.unify(b, te ? ctx.clone({ explain: ec(te, 'AC') }) : ctx)
        unified = true
        why = 'a*'
      }
      else if (
        b.isConjunct
        || b.isDisjunct
        || b.isPath
        || b.isPref
        || b.isFunc
        || b.isExpect
        || b.isSpread
      ) {
        out = b.unify(a, te ? ctx.clone({ explain: ec(te, 'BW') }) : ctx)
        unified = true
        why = 'bv'
      }
      // Exactly equal scalars (not caught by early fast-path — e.g.
      // because a or b isn't .done yet).
      else if (a.constructor === b.constructor && a.peg === b.peg) {
        out = update(a, b)
        why = 'up'
      }
      else {
        out = a.unify(b, te ? ctx.clone({ explain: ec(te, 'GN') }) : ctx)
        unified = true
        why = 'ab'
      }

      if (!out || !out.unify) {
        out = makeNilErr(ctx, 'unite', a, b, whence + '/nil')
        why += 'N'
      }

      // Any non-done top-level result self-unifies with TOP to ensure
      // its children finish converging. Skipped when `unified` is true
      // because the branch that set `out = X.unify(Y, ctx)` already
      // ran that Val's own unify logic.
      if (!out.done && !unified) {
        out = out.unify(top(), te ? ctx.clone({ explain: ec(te, 'ND') }) : ctx)
        why += 'T'
      }
    }
    catch (err: any) {
      // TODO: handle unexpected
      out = makeNilErr(ctx, 'internal', a, b)
    }
  }

  ctx.explain && explainClose(te, out)

  // Store in id-keyed cache when both operands were done.
  if (a?.done && b?.done && out?.done && ctx._uniteCache !== undefined) {
    ctx._uniteCache.set(a.id + '|' + b.id, out)
  }

  return out
}


function update(x: Val, _y: Val) {
  // TODO: update x with y.site
  return x
}


// Resolve all PathVals using the pre-collected paths list.
// Mutates the tree in place, replacing each PathVal with its cloned target.
function resolvePaths(root: Val, ctx: AontuContext, paths: PathVal[]) {
  for (const pv of paths) {
    if (pv.done) continue

    // Resolve: find target, following chains.
    // Suppress errors during pre-resolution — intermediate PathVals
    // (from multi-dot expressions like ..a.q) may fail here but the
    // final PathVal resolves correctly during unification.
    const savedErr = ctx.err
    ctx.err = []
    let found: any = pv.find(ctx)
    ctx.err = savedErr
    if (found == null || found.isNil) continue

    // Skip if target or container contains a mark-setting function
    // (type/hide/move) — let unification resolve it first.
    if (hasMarkFunc(found)) continue
    if (hasMarkFuncAtPath(root, pv.path)) continue

    while (found instanceof PathVal) {
      if (found.done && found._resolved) {
        found = found._resolved
        break
      }
      const next = found.find(ctx)
      if (next == null || next.isNil) break
      found.dc = DONE
      found._resolved = next
      found = next
    }

    // If found value is a key() function, set its path to the
    // destination so it evaluates at the right position.
    if (found.isKeyFunc) {
      found.path = pv.path
    }

    pv.dc = DONE
    pv._resolved = found

    // Replace PathVal in tree using its path
    replaceAtPath(root, pv.path, pv, found)

    // Walk the placed value to resolve any PathVals cloned into it
    resolveNestedPaths(found, ctx)
  }
}


// Check if a value contains a type() or hide() function.
// Check if the value AT the path position is inside a mark-setting function.
function hasMarkFuncAtPath(root: Val, path: string[]): boolean {
  let node: any = root
  for (let i = 0; i < path.length; i++) {
    const part = path[i]
    if (node.isMap || node.isList) {
      node = node.peg[part]
    }
    else if (node.isConjunct || node.isDisjunct) {
      let found = null
      const stack = [...node.peg]
      while (stack.length > 0) {
        const term = stack.pop()
        if (term?.isConjunct || term?.isDisjunct) {
          stack.push(...term.peg)
        }
        else if ((term?.isMap || term?.isList) && term.peg[part] != null) {
          found = term.peg[part]
          break
        }
      }
      node = found
    }
    else {
      return false
    }
    if (node == null) return false
  }
  return hasMarkFunc(node)
}


function hasMarkFunc(val: any): boolean {
  if (val == null || !val.isVal) return false
  if (val.isTypeFunc || val.isHideFunc || val.isMoveFunc) return true
  if (val.isConjunct || val.isDisjunct) {
    for (const t of val.peg) {
      if (hasMarkFunc(t)) return true
    }
  }
  return false
}


// Resolve any PathVals found inside a value (e.g. cloned subtrees).
// Iterative stack-based walk — no recursion.
function resolveNestedPaths(val: any, ctx: AontuContext) {
  const stack: any[] = [val]
  while (stack.length > 0) {
    const v = stack.pop()
    if (v == null || !v.isVal) continue

    if (v.isMap || v.isList) {
      for (const k in v.peg) {
        const child = v.peg[k]
        if (child instanceof PathVal && !child.done) {
          const found = child.find(ctx)
          if (found != null && !found.isNil) {
            v.peg[k] = found
            child.dc = DONE
            child._resolved = found
            stack.push(found)
          }
        }
        else if (child?.isVal) {
          stack.push(child)
        }
      }
    }
    else if (v.isConjunct || v.isDisjunct) {
      for (let i = 0; i < v.peg.length; i++) {
        const child = v.peg[i]
        if (child instanceof PathVal && !child.done) {
          const found = child.find(ctx)
          if (found != null && !found.isNil) {
            v.peg[i] = found
            child.dc = DONE
            child._resolved = found
            stack.push(found)
          }
        }
        else if (child?.isVal) {
          stack.push(child)
        }
      }
    }
    else if (v.isFeature) {
      if (v.peg instanceof PathVal && !v.peg.done) {
        const found = v.peg.find(ctx)
        if (found != null && !found.isNil) {
          v.peg.dc = DONE
          v.peg._resolved = found
          v.peg = found
          stack.push(found)
        }
      }
      else if (Array.isArray(v.peg)) {
        for (let i = 0; i < v.peg.length; i++) {
          if (v.peg[i]?.isVal) stack.push(v.peg[i])
        }
      }
      else if (v.peg?.isVal) {
        stack.push(v.peg)
      }
    }
  }
}


// Replace target Val in the tree, using path to navigate and a stack
// to search through junctions, features, and nested structures.
// No recursion — uses a single loop with an explicit stack.
function replaceAtPath(root: Val, path: string[], target: Val, replacement: Val,
  intoSpreads: boolean = true): boolean {
  let node: any = root

  // Descend through map/list using path segments.
  // When a non-map/list is encountered (junction, feature),
  // push its children onto the search stack and stop descending.
  let pi = 0
  for (; pi < path.length; pi++) {
    if (node.isMap || node.isList) {
      const child = node.peg[path[pi]]
      if (child == null) break

      // Last segment: check for direct replacement
      if (pi === path.length - 1) {
        if (child === target) {
          node.peg[path[pi]] = replacement
          return true
        }
        // Target not at this position — search within child
        node = child
        pi++
        break
      }

      node = child
    }
    else {
      // Hit a non-navigable node — search it
      break
    }
  }

  // If path fully consumed with no match, or hit a junction/feature,
  // search the current node using a stack.
  const stack: any[] = [node]

  while (stack.length > 0) {
    const val = stack.pop()
    if (val == null || !val.isVal) continue

    if (val.isMap || val.isList) {
      for (const k in val.peg) {
        if (val.peg[k] === target) {
          val.peg[k] = replacement
          return true
        }
        if (val.peg[k]?.isVal) stack.push(val.peg[k])
      }
    }
    else if (val.isConjunct || val.isDisjunct) {
      for (let i = 0; i < val.peg.length; i++) {
        if (val.peg[i] === target) {
          val.peg[i] = replacement
          return true
        }
        stack.push(val.peg[i])
      }
    }
    else if (val.isFeature) {
      if (val.peg === target) {
        val.peg = replacement
        return true
      }
      if (intoSpreads || !val.isSpread) {
        if (Array.isArray(val.peg)) {
          for (let i = 0; i < val.peg.length; i++) {
            if (val.peg[i] === target) {
              val.peg[i] = replacement
              return true
            }
            if (val.peg[i]?.isVal) stack.push(val.peg[i])
          }
        }
        else if (val.peg?.isVal) {
          stack.push(val.peg)
        }
      }
    }
  }

  return false
}


// Resolve all KeyFuncVals (not inside spreads) to StringVals.
// Uses the KeyFuncVal's path to determine the key name.
function resolveKeys(root: Val, keys: KeyFuncVal[]) {
  for (const kv of keys) {
    const resolved = kv.resolve(null as any, kv.peg)
    if (resolved instanceof StringVal) {
      resolved.dc = DONE
      resolved.path = kv.path
      replaceAtPath(root, kv.path, kv, resolved, false)
    }
  }
}


class Unify {
  root: Val
  res: Val
  // err: Omit<NilVal[], "push">
  err: any[]
  explain: any[] | null
  cc: number
  lang: Lang

  constructor(root: Val | string, lang?: Lang, ctx?: AontuContext | any, src?: any) {
    this.lang = lang || new Lang()
    if ('string' === typeof root) {
      root = this.lang.parse(root)
    }

    if ('string' !== typeof src) {
      src = ''
    }

    this.cc = 0
    this.root = root
    this.res = root
    // Always use a fresh array for mutable error collection to avoid
    // mutating the shared EMPTY_ERR singleton on Val instances.
    this.err = ctx?.err ?? (root.err.length > 0 ? root.err : [])
    this.explain = ctx?.explain ?? root.explain ?? null

    let res = root
    let uctx: AontuContext

    // Only unify if no syntax errors
    if (!(root as NilVal).isNil) {
      if (ctx instanceof AontuContext) {
        uctx = ctx
      }
      else {
        uctx = new AontuContext({
          ...(ctx || {}),
          root: res,
          err: this.err,
          explain: this.explain,
          src,
        })
      }

      // TODO: messy
      // uctx.seterr(this.err)
      uctx.err = this.err
      uctx.explain = this.explain

      // Path resolution phase: replace all PathVals with cloned targets.
      // Pure structural replacement — no unification.
      resolvePaths(res, uctx, this.lang.paths)
      uctx = uctx.clone({ root: res })

      // Key resolution phase: replace key() functions (not in spreads)
      // with their resolved StringVal.
      resolveKeys(res, this.lang.keys)

      const explain = null == ctx?.explain ? undefined : ctx?.explain
      const te = explain && explainOpen(uctx, explain, 'root', res)

      // NOTE: if true === res.done already, then this loop never needs to run.
      // RefVals defer on cc=0 and while ctx.sc > 0.
      // SpreadVal.unify maintains ctx.sc via increment/decrement.
      let maxcc = 9 // 99
      for (; this.cc < maxcc && DONE !== res.dc; this.cc++) {
        // console.log('CC', this.cc, res.canon)
        uctx.cc = this.cc
        uctx.seen = new Map()
        uctx._refCloneCache = new Map()
        uctx._uniteCache = new Map()
        res = unite(te ? uctx.clone({ explain: ec(te, 'run') }) : uctx, res, top(), 'unify')

        if (0 < uctx.err.length) {
          break
        }

        uctx = uctx.clone({ root: res })
      }

      uctx.explain && explainClose(te, res)
    }

    this.res = res
  }
}




export {
  Unify,
  unite,
}
