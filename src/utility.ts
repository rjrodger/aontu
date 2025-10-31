/* Copyright (c) 2023-2025 Richard Rodger, MIT License */



import type { Val } from './type'


// Mark value in source is propagated to target (true ratchets).
function propagateMarks(source: Val, target: Val): void {
  for (let name in source.mark) {
    (target.mark as any)[name] = (target.mark as any)[name] || (source.mark as any)[name]
  }
}


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


const T_NOTE = 0
const T_WHY = 1
const T_AVAL = 2
const T_BVAL = 3
const T_OVAL = 4
const T_CHILDREN = 5


function explainOpen(
  ctx: any,
  t: any[] | undefined | null | false,
  note: string,
  ac?: Val,
  bc?: Val
): any[] | null {
  if (false === t) return null;

  t = t ?? [null, 'root', null, null, null, null]
  t[T_WHY] = t[T_WHY] ?? ''
  t[T_NOTE] = (0 <= ctx.cc ? ctx.cc + '~' : '') + note
  if (ac) {
    t[T_AVAL] = ac.id + (ac.done ? '' : '!') + '=' + ac.canon
  }
  if (bc) {
    t[T_BVAL] = bc.id + (bc.done ? '' : '!') + '=' + bc.canon
  }

  return t
}


function ec(t: any[] | undefined | null, why: string) {
  if (null == t) return;

  const child = [null, why, null, null, null, null]
  t[T_CHILDREN] = t[T_CHILDREN] ?? []
  t[T_CHILDREN].push(child)
  return child
}


function explainClose(t: any[] | undefined | null, out?: Val) {
  if (null == t) return;

  if (out) {
    t[T_OVAL] = out.id + (out.done ? '' : '!') + '=' + out.canon
  }
}


function formatExplain(t: any[], d?: number) {
  d = null == d ? 0 : d
  const indent = ('  '.repeat(d))

  if (Array.isArray(t)) {
    const b = [
      indent + t.slice(0, t.length - 1).join(' ')
    ]

    const children = t[t.length - 1]
    if (Array.isArray(children)) {
      for (let ce of children) {
        b.push(formatExplain(ce, d + 1))
      }
    }

    return b.join('\n')
  }
  else {
    return indent + t
  }
}



export {
  propagateMarks,
  formatPath,
  walk,
  WalkApply,
  explainOpen,
  ec,
  explainClose,
  formatExplain,
}

