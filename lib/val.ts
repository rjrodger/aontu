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
  depth: number

  pathmap: { [key: string]: Val } = {}
  refs: Path[]

  resolvemap: { [key: string]: Val } = {}

  constructor(path?: Path) {
    this.path = path || new Path('$')
    this.depth = 0
    this.refs = []
  }


  add(val: Val) {
    if (val.path) {
      if (!this.pathmap[val.path.str]) {
        this.pathmap[val.path.str] = val
      }
    }
    return this
  }

  get(pstr: string) {
    return new Path(pstr).resolve(this)
  }

  /*
  descend(part: string): Context {
    let child: Context = new Context(this.path.append(new Path(part)))
    child.pathmap = this.pathmap
    child.resolvemap = this.resolvemap
    return child
  }
  */

  descend(ref?: Path): Context {
    let child: Context = new Context(this.path)
    child.depth = this.depth + 1
    if (ref) {
      child.refs = this.refs.concat(ref)
    }

    child.pathmap = this.pathmap



    child.resolvemap = this.resolvemap
    return child
  }


  describe() {
    return Object
      .keys(this.pathmap)
      .sort()
      .map(ps => ps + ': ' + this.pathmap[ps]).join('\n') + '\n'
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
  path?: Path

  constructor(path?: Path) {
    this.path = path
    this.val = this
  }

  toString(): string {
    return this === this.val ? this.str() : this.val.toString()
  }

  unify(other: Val, ctx: Context): Val {
    ctx = ctx.descend().add(this)

    console.log('UA:' + ctx.depth + ' ' + this.constructor.name + ' t:' + this + ' o:' + other)

    if (ctx.depth > 11) {
      console.log('DEPTH')
      return new BottomVal()
    }

    if (other instanceof BottomVal) {
      return this.val = other
    }

    //if (other instanceof RefVal) {
    //  return this.val = other.unify(this.val || this, ctx)
    //}

    let oval = other.val || other
    let val: Val | undefined

    if (!this.val || this.val === this) {
      val = this.unifier(oval, ctx)
    }
    else {
      val = this.val.unify(oval, ctx)
    }

    if (!val) {
      val = new BottomVal()
    }

    console.log('UB:' + ctx.depth + ' ' + this.constructor.name + ' t:' + this + ' o:' + other + ' -> ' + val)

    return this.val = val
  }

  abstract unifier(other: Val, ctx?: Context): Val | undefined
  abstract str(): string
}



class TopVal extends Val {
  constructor(path?: Path) {
    super(path)
  }

  unifier(other: Val, ctx: Context): Val {
    if (other instanceof TopVal) {
      return this
    }
    else {
      return other.unify(this, ctx)
    }
  }

  str() {
    return '$T'
  }
}


class BottomVal extends Val {

  // TODO: constructor that captures error
  constructor(path?: Path) {
    super(path)
  }

  unifier() {
    return this
  }

  str() {
    return '$B'
  }
}


class IntTypeVal extends Val {
  constructor(path?: Path) {
    super(path)
  }

  unifier(other: Val, ctx: Context): Val | undefined {
    if (other instanceof TopVal) {
      return this
    } else if (other instanceof MeetVal) {
      return other.unify(this, ctx)
    } else if (other instanceof IntScalarVal) {
      return other
    } else if (other instanceof IntTypeVal) {
      return this
    }
  }

  str() {
    return '$int'
  }
}


class IntScalarVal extends Val {
  scalar: number

  constructor(scalar: number, path?: Path) {
    super(path)
    this.scalar = scalar
  }

  unifier(other: Val, ctx: Context): Val | undefined {
    if (other instanceof TopVal) {
      return this
    }

    else if (other instanceof MeetVal) {
      return other.unify(this, ctx)
    }

    else if (other instanceof RefVal) {
      return other.unify(this, ctx)
    }

    else if (other instanceof IntTypeVal) {
      return this
    }

    else if (other instanceof IntScalarVal) {
      return other.scalar === this.scalar ? other : undefined
    }
  }

  str() {
    return this.scalar.toString()
  }
}


/*


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
*/


type Vals = Val[]


class MeetVal extends Val {
  vals: Vals


  constructor(vals: Vals, path?: Path) {
    super(path)
    this.vals = vals
  }

  unifier(other: Val, ctx: Context): Val | undefined {
    let cur = other

    for (let vI = 0; vI < this.vals.length; vI++) {
      cur = this.vals[vI].unify(cur, ctx)
    }

    return cur
  }

  str() {
    return this.vals.map(v => v.toString()).join(' & ')
  }
}




class RefVal extends Val {
  ref: Path

  constructor(ref: Path, path?: Path) {
    super(path)
    this.ref = ref
  }

  unifier(other: Val, ctx: Context): Val | undefined {
    ctx.refs.push(this.ref)
    // TODO: unify with same
    // cycles cancel if path =/= ref ?

    let oval: Val | undefined = other
    if (oval instanceof RefVal) {
      if (oval.ref.equals(this.ref)) {
        return this.ref.resolve(ctx)
      }

      if (this.ref.equals(oval.path) && oval.ref.equals(this.path)) {
        return new TopVal(this.path)
      }

      oval = oval.ref.resolve(ctx)

      if (!oval) {
        return new MeetVal([
          new RefVal(this.ref, this.path),
          new RefVal((other as RefVal).ref, this.path),
        ], this.path)
      }
    }

    let val = this.ref.resolve(ctx)

    if (val) {
      return val.unify(oval, ctx)
    }
    else {
      return new MeetVal([
        new RefVal(this.ref, this.path),
        other
      ], this.path)
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
    let seen = ctx.refs.find(ref => ref.equals(this))
    return seen ? new TopVal(this) : ctx.pathmap[this.str]
  }


  append(other: Path) {
    return new Path([...this.parts, ...other.parts])
  }

  slice(n: number) {
    return new Path(this.parts.slice(n))
  }

  equals(other: Path | undefined) {
    return other ? this.str === other.str : false
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
  // MapVal,
  MeetVal,
  RefVal,
}
