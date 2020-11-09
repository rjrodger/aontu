/* Copyright (c) 2020 Richard Rodger, MIT License */

// NOTE: when implementing objects and arrays, preserve exploded path style
// adding unifier vals referencing schema "types" should suffice

// $.a: object
// $.a.b: int
// $.z.k: $.a # marks this as an object
// $.z.k.b: 1 # append val($.a.b)=int
// $.z.k.c: 2 # append nothing as val($.a.c) undefined

// $.a.*: int // all children must unify with this
// $.b: $.a // array of int
// $.b.0: 1
// $.b.1: 2

// TODO: parse traditional JSON into exploded style as above

function unify(orignodes: (Node | string)[]): Node[] {
  let meta = { s: Date.now(), d: 0 }
  let nodes: Node[] = orignodes
    .map((n) => {
      if ('string' === typeof n) {
        return parseNode(n)
      } else {
        return Node.clone(n)
      }
    })
    .sort((a: Node, b: Node) => {
      let plen = a.path.parts.length - b.path.parts.length
      return 0 === plen
        ? a.path.parts_str < b.path.parts_str
          ? -1
          : a.path.parts_str > b.path.parts_str
          ? 1
          : 0
        : plen
    })

  nodes = nodes.reduce((out: Node[], n, i, nodes) => {
    let prev = nodes[i - 1]
    if (prev && n.path.equals(prev.path)) {
      prev.vals.splice(prev.vals.length, 0, ...n.vals)
    } else {
      out.push(n)
    }
    return out
  }, [])

  let root_ctx = {
    path: new Path([]),
    nodes: nodes,
  }

  let origlen = nodes.length
  for (let nI = 0; nI < nodes.length && nI < 11 * origlen; nI++) {
    let node = nodes[nI]
    if (!node) {
      break
    }

    let val = node.unify(root_ctx)

    if (undefined === val) {
      nodes.push(node)
    }
  }

  meta.d = Date.now() - meta.s
  ;(nodes as any).$meta = meta

  return nodes.slice(0, origlen)
}

function reify(nodes: Node[]): any {
  let out = {}

  for (let nI = 0; nI < nodes.length; nI++) {
    let node = nodes[nI]
    inject(out, node.path.parts, node.val)
  }

  return out
}

function inject(obj: any, parts: string[], val: any) {
  let cur = obj
  for (let pI = 0; pI < parts.length; pI++) {
    cur = cur[parts[pI]] =
      cur[parts[pI]] ||
      (pI < parts.length - 1
        ? {}
        : // TODO: should be Val.reify()
          (val as any).scalar)
  }
}

function resolve(path: Path, nodes: Node[]) {
  let node = nodes.find((n) => path.equals(n.path))
  return node ? node.val : undefined
}

class Node {
  path: Path
  val?: Val
  vals: Val[]

  static clone(node: Node): Node {
    return new Node(node.path, node.vals)
  }

  constructor(path: Path | string | string[], vals: string | (Val | string)[]) {
    this.path = new Path(path)

    this.vals =
      'string' === typeof vals
        ? parseVals(vals)
        : vals.map((v) => {
            if ('string' === typeof v) {
              return parseVal(v)
            } else {
              return v
            }
          })
  }

  unify(root_ctx: UnifyContext): Val | undefined {
    if (this.val) return this.val

    let ctx = {
      ...root_ctx,
      path: this.path,
    }

    let val: Val | undefined = top
    for (let vI = 0; vI < this.vals.length; vI++) {
      val = (val as Val).unify(this.vals[vI], ctx)

      if (!val) {
        break
      }
    }

    if (val) {
      this.val = val
    }

    return this.val
  }

  toString() {
    return this.path.parts_str + ': ' + this.val + ' # ' + this.vals
  }
}

class Path {
  parts: string[] = []
  parts_str: string = ''

  constructor(parts: Path | string | string[]) {
    parts = parts instanceof Path ? parts.parts : parts
    this.parts = 'string' === typeof parts ? parts.split(/\./) : [...parts]
    this.parts_str = this.parts.join('.')
  }

  equals(other: Path) {
    return this.parts_str === other.parts_str
  }

  deeper(other: Path) {
    return this.parts.length > other.parts.length
  }
}

function parseNode(s: string) {
  let [pathstr, valstr] = s.split(':')
  return new Node(pathstr, valstr)
}

function parseVal(s: string): Val {
  let val: Val = bottom

  s = s.trim()

  let n = parseInt(s)
  if (!isNaN(n)) {
    return new IntScalarVal(n)
  }

  if ('int' === s) {
    return new IntTypeVal()
  }

  if (s.startsWith('$')) {
    return new RefVal(new Path(s))
  }

  return val
}

function parseVals(s: string): Val[] {
  return s
    .split(/\s*,\s*/)
    .filter((vs) => '' !== vs)
    .map((vs) => parseVal(vs))
}

interface UnifyContext {
  path: Path
  nodes: Node[]
}

interface Val {
  unify(other: Val, ctx: UnifyContext): Val | undefined
  toString(): string
}

class TopVal implements Val {
  unify(other: Val, ctx: UnifyContext) {
    return other.unify(this, ctx)
  }
  toString() {
    return 'top'
  }
}
const top = new TopVal()

class BottomVal implements Val {
  unify() {
    return this
  }
  toString() {
    return 'bottom'
  }
}
const bottom = new BottomVal()

class IntTypeVal implements Val {
  unify(other: Val) {
    let out: Val = bottom

    if (other instanceof TopVal) {
      return this
    } else if (other instanceof IntScalarVal) {
      out = other
    } else if (other instanceof IntTypeVal) {
      out = other
    }

    return out
  }
  toString() {
    return 'int'
  }
}

class IntScalarVal implements Val {
  scalar: number

  constructor(val: number) {
    this.scalar = val
  }

  unify(other: Val, ctx: UnifyContext) {
    let out: Val = bottom

    if (other instanceof TopVal) {
      return this
    } else if (other instanceof IntScalarVal) {
      return other.scalar === this.scalar ? other : bottom
    } else if (other instanceof IntTypeVal) {
      return this
    }

    return out
  }

  toString() {
    return 'int=' + this.scalar
  }
}

class RefVal implements Val {
  val: Val | undefined = undefined
  path: Path

  constructor(path: Path) {
    this.path = path
  }

  unify(other: Val, ctx: UnifyContext) {
    let out: Val | undefined = undefined

    this.val = resolve(this.path, ctx.nodes)

    if (this.val) {
      out = this.val = this.val.unify(other, ctx)
    }

    return out
  }

  toString() {
    return this.path.parts_str
  }
}

export {
  unify,
  reify,
  Node,
  Path,
  Val,
  BottomVal,
  IntTypeVal,
  IntScalarVal,
  RefVal,
  bottom,
  parseVal,
}
