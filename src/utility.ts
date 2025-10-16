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
  // console.log('WALK-START', val.constructor.name, val.canon)

  let out = null == before ? val : before(key, val, parent, path || [])

  maxdepth = null != maxdepth && 0 <= maxdepth ? maxdepth : 32
  if (null != maxdepth && 0 === maxdepth) {
    return out
  }
  if (null != path && null != maxdepth && 0 < maxdepth && maxdepth <= path.length) {
    return out
  }

  // console.log('WALK-PEG', out.canon)

  const child: any = out.peg

  // Container Vals (Map etc) have peg = plain {} or []
  if (null != child && !child.isVal) {
    if ('object' === typeof child) {
      for (let ckey in child) {
        child[ckey] = walk(
          child[ckey], before, after, maxdepth, ckey, out, [...(path || []), ckey])
      }
    }
    else if (Array.isArray(child)) {
      for (let i = 0; i < child.length; i++) {
        child[i] = walk(
          child[i], before, after, maxdepth, i, out, [...(path || []), '' + i])
      }
    }
  }

  out = null == after ? out : after(key, out, parent, path || [])

  return out
}

export {
  formatPath,
  walk,
  WalkApply,
}

