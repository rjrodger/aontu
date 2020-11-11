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
        return n.clone()
      }
    })

  /*
    // sort so that same paths end up contiguous
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
  */

  let pathmap: any = {}

  // merge same path values
  nodes = nodes.reduce((out: Node[], n, i, nodes) => {
    //let prev = nodes[i - 1]
    //if (prev && n.path.equals(prev.path)) {
    let prev = pathmap[n.path.parts_str]
    if (prev) {
      prev.vals.splice(prev.vals.length, 0, ...n.vals)
    } else {
      out.push(n)
      pathmap[n.path.parts_str] = n
    }
    return out
  }, [])

  let root_ctx = {
    path: new Path([]),
    nodes: nodes,
    index: 0
  }

  let origlen = nodes.length

  // FIX: max val is just a hack to stop infinit loops
  for (let nI = 0; nI < nodes.length && nI < 11 * origlen; nI++) {
    let node = nodes[nI]
    if (!node) {
      break
    }

    root_ctx.index = nI
    let resnodes = node.unify(root_ctx)

    // TODO: search pathmap, and append vals if path matches

    nodes.push(...resnodes)
  }

  meta.d = Date.now() - meta.s
    ; (nodes as any).$meta = meta

  return nodes
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
  if (null == val) return

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

function resolve(path: Path, ctx: UnifyContext) {
  // TODO: use pathmap (overwrite refvals!)
  let index = ctx.nodes.findIndex((n) => {
    return path.equals(n.path) && null != n.val
  })

  let node = ctx.nodes[index]
  let val = node ? node.val : undefined

  if (val instanceof MapVal) {
    val = new NodesVal(index, path, ctx.nodes[ctx.index].path)
  }

  return val
}

class Node {
  path: Path
  val?: Val
  vals: Val[]

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

  clone(to?: Path): Node {
    let cn = new Node(to || this.path, this.vals)
    cn.val = this.val
    return cn
  }

  unify(root_ctx: UnifyContext): Node[] {
    if (this.val) return []

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

    if (val instanceof DeferVal) {
      return [this]
    }
    else if (val instanceof NodesVal) {
      return val.nodes
    }
    else {
      this.val = val
      return []
    }
  }

  toString() {
    return this.path.parts_str + ': ' + this.val + ' # ' + this.vals
  }
}

class Path {
  parts: string[] = []
  parts_str: string = ''
  length: number = 0

  constructor(parts: Path | string | string[]) {
    parts = parts instanceof Path ? parts.parts : parts
    this.parts = 'string' === typeof parts ? parts.split(/\./) : [...parts]
    this.length = this.parts.length
    this.parts_str = this.parts.join('.')
  }

  append(other: Path) {
    return new Path([...this.parts, ...other.parts])
  }

  slice(n: number) {
    return new Path(this.parts.slice(n))
  }

  equals(other: Path) {
    return this.parts_str === other.parts_str
  }

  deeper(other: Path) {
    //return this.parts_str != other.parts_str &&
    return this.parts_str.startsWith(other.parts_str)
  }

  toString() {
    return this.parts_str
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

  if (s.startsWith('{}')) {
    return new MapVal()
  }

  if (s.startsWith('[]')) {
    return new ListVal()
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
  index: number
}

interface Val {
  unify(other: Val, ctx: UnifyContext): Val
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

class DeferVal implements Val {
  unify(other: Val) {
    return other instanceof BottomVal ? other : this
  }
  toString() {
    return 'defer'
  }
}
const defer = new DeferVal()



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

  unify(other: Val) {
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
    let out: Val = defer

    // TODO: unify with same

    this.val = resolve(this.path, ctx)

    if (this.val) {
      out = this.val = this.val.unify(other, ctx)
    }

    return out
  }

  toString() {
    return this.path.parts_str
  }
}


class NodesVal implements Val {
  from_index: number
  from: Path
  to: Path
  nodes: Node[]

  constructor(from_index: number, from: Path, to: Path) {
    this.from_index = from_index
    this.from = from
    this.to = to
    this.nodes = []
  }

  unify(other: Val, ctx: UnifyContext) {
    let out: Val = bottom

    if (other instanceof TopVal) {
      let index = this.from_index


      // FIX: doesn't really work as misses earlier values
      while (ctx.nodes[index].path.deeper(this.from)) {
        let suffix = ctx.nodes[index].path.slice(this.from.length)
        // console.log('sx', this.from, this.from.length, '' + suffix)
        let to = this.to.append(suffix)
        this.nodes.push(ctx.nodes[index].clone(to))
        index++
      }

      return this
    }

    return out
  }

  toString() {
    return 'N=' + this.from_index + '~' + this.to.parts_str + ':' + this.from.parts_str
  }
}


class MapVal implements Val {
  unify(other: Val) {
    let out: Val = bottom

    if (other instanceof TopVal) {
      return this
    } else if (other instanceof MapVal) {
      return other
    }

    return out
  }

  toString() {
    return '{}'
  }
}


class ListVal implements Val {
  unify(other: Val) {
    let out: Val = bottom

    if (other instanceof TopVal) {
      return this
    } else if (other instanceof ListVal) {
      return other
    }

    return out
  }

  toString() {
    return '{}'
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
  NodesVal,
  MapVal,
  ListVal,
  top,
  defer,
  bottom,
  parseVal,
  parseNode,
}
