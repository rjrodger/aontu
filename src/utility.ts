/* Copyright (c) 2023 Richard Rodger, MIT License */



import type { Val } from './type'

function formatPath(path: Val | string[], absolute?: boolean) {
  let parts: string[]
  if (Array.isArray(path)) {
    parts = path
  }
  else {
    parts = path.path
  }

  let pathstr = (0 < parts.length && false !== absolute ? '$.' : '') + parts.join('.')

  return pathstr
}


type WalkApply = (
  key: string | number | undefined,
  val: Val,
  parent: Val | undefined,
  path: (string | number)[]
) => Val

/**
 * Walk a Val structure depth first, applying functions before and after descending.
 * Only traverses Val instances - stops at non-Val children.
 */
function walk(
  // These arguments are the public interface.
  val: Val,

  // Before descending into a node.
  before?: WalkApply,

  // After descending into a node.
  after?: WalkApply,

  // Maximum recursive depth, default: 32. Use null for infinite depth.
  maxdepth?: number | null,

  // These arguments are used for recursive state.
  key?: string | number,
  parent?: Val,
  path?: (string | number)[]
): Val {
  let out = null == before ? val : before(key, val, parent, path || [])

  maxdepth = null != maxdepth && 0 <= maxdepth ? maxdepth : 32
  if (null != maxdepth && 0 === maxdepth) {
    return out
  }
  if (null != path && null != maxdepth && 0 < maxdepth && maxdepth <= path.length) {
    return out
  }

  // Walk children in Val.peg
  if (isVal(out) && null != out.peg) {
    const peg = out.peg

    // Handle array peg (ListVal, ConjunctVal, DisjunctVal, etc.)
    if (Array.isArray(peg)) {
      for (let i = 0; i < peg.length; i++) {
        const child = peg[i]
        if (isVal(child)) {
          peg[i] = walk(
            child,
            before,
            after,
            maxdepth,
            i,
            out,
            [...(path || []), i]
          )
        }
      }
    }
    // Handle object peg (MapVal)
    else if ('object' === typeof peg && null !== peg) {
      for (let key in peg) {
        const child = peg[key]
        if (isVal(child)) {
          peg[key] = walk(
            child,
            before,
            after,
            maxdepth,
            key,
            out,
            [...(path || []), key]
          )
        }
      }
    }
    // Single Val in peg (PrefVal, etc.)
    else if (isVal(peg)) {
      out.peg = walk(
        peg,
        before,
        after,
        maxdepth,
        '',
        out,
        [...(path || []), '']
      )
    }
  }

  out = null == after ? out : after(key, out, parent, path || [])

  return out
}

function isVal(v: any): v is Val {
  return v && 'object' === typeof v && v.isVal === true
}


export {
  formatPath,
  walk,
  WalkApply,
}

