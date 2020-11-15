/* Copyright (c) 2020 Richard Rodger, MIT License */

//import Jsonic from 'jsonic'
//const Jsonic = require('jsonic')



// QUESTION: should unify clone or update both?
// does it matter if reference paths are maintained separately?



/*
interface Val {
  final: boolean
  path?: Path
  unify(other: Val, ctx: Context): Val
  clone(): Val // TODO: include history as params
  toString(): string
}
*/

class Update {
  val: Val

  constructor(val: Val) {
    this.val = val
  }
}

class Context {
  path: Path

  pathmap: { [key: string]: Val } = {}
  resolvemap: { [key: string]: Val } = {}

  constructor(path: Path) {
    this.path = path
  }

  descend(part: string): Context {
    let child: Context = new Context(this.path.append(new Path(part)))
    child.pathmap = this.pathmap
    child.resolvemap = this.resolvemap
    return child
  }

  /*
  update(val: Val): Update {
    let pstr = val.ctx.path.str
    this.pathmap[pstr] = val

    if (val.final) {
      delete this.resolvemap[pstr]
    }
    else {
      this.resolvemap[pstr] = val
    }

    return new Update(val)
  }
  */
}


abstract class Val {
  val: Val
  path: Path

  constructor(path: Path) {
    this.path = path
    this.val = this
  }

  toString(): string {
    return this === this.val ? this.str() : this.val.toString()
  }

  abstract unify(other: Val, ctx?: Context): Val
  abstract str(): string
}



class TopVal extends Val {
  constructor(path: Path) {
    super(path)
  }

  unify(other: Val, ctx?: Context) {
    let oval = other.val

    if (oval instanceof TopVal) {
      return this.val
    }
    else {
      return this.val = oval.unify(this.val)
    }
  }

  str() {
    return '$T'
  }
}


class BottomVal extends Val {

  // TODO: constructor that captures error
  constructor(path: Path) {
    super(path)
  }

  unify() {
    return this.val
  }

  str() {
    return '$B'
  }
}


class IntTypeVal extends Val {
  constructor(path: Path) {
    super(path)
  }

  unify(other: Val): Val {
    let oval = other.val

    if (other instanceof TopVal) {
      return this.val
    } else if (other instanceof IntScalarVal) {
      return this.val = oval
    } else if (other instanceof IntTypeVal) {
      return this.val
    }

    return this.val = new BottomVal(this.path)
  }

  str() {
    return '$int'
  }
}


class IntScalarVal extends Val {
  scalar: number

  constructor(path: Path, scalar: number) {
    super(path)
    this.scalar = scalar
  }

  unify(other: Val): Val {
    let oval = other.val

    if (oval instanceof TopVal) {
      return this.val
    }

    else if (oval instanceof IntTypeVal) {
      return this
    }

    else if (oval instanceof IntScalarVal) {
      let self = this.val as IntScalarVal
      return this.val = oval.scalar === self.scalar ? oval :
        new BottomVal(this.path)
    }

    return this.val = new BottomVal(this.path)
  }

  str() {
    return this.scalar.toString()
  }
}



type ValMap = { [key: string]: Val }


class MapVal extends Val {
  map: ValMap


  constructor(path: Path, map: ValMap) {
    super(path)
    this.map = map
  }

  unify(other: Val): Val {
    let oval = other.val

    if (oval instanceof TopVal) {
      let map: ValMap = {}

      let fields = Object.keys(this.map)
      for (let fI = 0; fI < fields.length; fI++) {
        let fn = fields[fI]
        map[fn] = this.map[fn].unify(oval)
      }

      return this.val
    }

    else if (oval instanceof MapVal && this.val instanceof MapVal) {
      let map = this.val.map

      let ofields = Object.keys(oval.map)
      for (let ofI = 0; ofI < ofields.length; ofI++) {
        let ofn = ofields[ofI]
        let ofv = oval.map[ofn]
        let fv = map[ofn]
        let uv = null == fv ? ofv : ofv.unify(fv)
        map[ofn] = uv
      }

      return this.val
    }

    return this.val = new BottomVal(this.path)
  }


  str() {
    let b = ['{']
    let fields = Object.keys(this.map)
    for (let fI = 0; fI < fields.length; fI++) {
      let fn = fields[fI]
      b.push(fn, ':', this.map[fn].toString(), ',')
    }
    b.push('}')
    return b.join('')
  }
}


type Vals = Val[]


class MeetVal extends Val {
  vals: Vals


  constructor(path: Path, vals: Vals) {
    super(path)
    this.vals = vals
  }

  unify(other: Val, ctx?: Context): Val {
    let oval = other.val

    if (!(this.val instanceof MeetVal)) {
      return this.val = this.val.unify(oval)
    }

    let meets: Vals = []
    let vals = this.val.vals
    let cur = new TopVal(this.path)

    for (let vI = 0; vI < vals.length; vI++) {
      let val = vals[vI].unify(oval, ctx)

      // returns MeetVal if children cannot yet unify due to unresolved refs
      if (val instanceof MeetVal) {
        meets.push(...val.vals)
      }
      else {
        cur = cur.unify(val, ctx)
        if (cur instanceof MeetVal) {
          meets.push(cur)
          cur = new TopVal(this.path)
        }
      }
    }

    if (0 == meets.length) {
      return this.val = cur
    }
    else {
      return this.val = new MeetVal(this.path, [cur, ...meets])
    }
  }

  str() {
    return this.vals.map(v => v.toString()).join(' & ')
  }
}


class RefVal extends Val {
  ref: Path

  constructor(path: Path, ref: Path) {
    super(path)
    this.ref = ref
  }

  unify(other: Val, ctx?: Context): Val {
    let oval = other.val

    // TODO: unify with same
    // cycles cancel if path =/= ref ?

    let val = ctx ? this.ref.resolve(ctx) : undefined

    if (val) {
      return this.val = val.unify(oval)
    }
    else {
      return this.val = new MeetVal(this.path, [
        new RefVal(this.path, this.ref),
        oval
      ])
    }
  }


  str() {
    return this.ref.str
  }
}


class Path {
  parts: string[] = []
  str: string = ''
  length: number = 0

  constructor(parts: Path | string | string[]) {
    parts = parts instanceof Path ? parts.parts : parts
    this.parts = 'string' === typeof parts ? parts.split(/\./) : [...parts]
    this.length = this.parts.length
    this.str = this.parts.join('.')
  }

  resolve(ctx: Context): Val | undefined {
    return ctx.pathmap[this.str]
  }


  append(other: Path) {
    return new Path([...this.parts, ...other.parts])
  }

  slice(n: number) {
    return new Path(this.parts.slice(n))
  }

  equals(other: Path) {
    return this.str === other.str
  }

  deeper(other: Path) {
    //return this.parts_str != other.parts_str &&
    return this.str.startsWith(other.str)
  }

  toString() {
    return this.str
  }
}


export {
  Context,
  Path,
  Val,
  TopVal,
  BottomVal,
  IntTypeVal,
  IntScalarVal,
  MapVal,
  MeetVal,
  RefVal,
}
