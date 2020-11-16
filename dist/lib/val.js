"use strict";
/* Copyright (c) 2020 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefVal = exports.MeetVal = exports.IntScalarVal = exports.IntTypeVal = exports.BottomVal = exports.TopVal = exports.Val = exports.Path = exports.Context = void 0;
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
    constructor(val) {
        this.val = val;
    }
}
class Context {
    constructor(path) {
        this.pathmap = {};
        this.resolvemap = {};
        this.path = path || new Path('$');
        this.depth = 0;
        this.refs = [];
    }
    add(val) {
        if (val.path) {
            if (!this.pathmap[val.path.str]) {
                this.pathmap[val.path.str] = val;
            }
        }
        return this;
    }
    get(pstr) {
        return new Path(pstr).resolve(this);
    }
    /*
    descend(part: string): Context {
      let child: Context = new Context(this.path.append(new Path(part)))
      child.pathmap = this.pathmap
      child.resolvemap = this.resolvemap
      return child
    }
    */
    descend(ref) {
        let child = new Context(this.path);
        child.depth = this.depth + 1;
        if (ref) {
            child.refs = this.refs.concat(ref);
        }
        child.pathmap = this.pathmap;
        child.resolvemap = this.resolvemap;
        return child;
    }
    describe() {
        return Object
            .keys(this.pathmap)
            .sort()
            .map(ps => ps + ': ' + this.pathmap[ps]).join('\n') + '\n';
    }
}
exports.Context = Context;
class Val {
    constructor(path) {
        this.path = path;
        this.val = this;
    }
    toString() {
        return this === this.val ? this.str() : this.val.toString();
    }
    unify(other, ctx) {
        ctx = ctx.descend().add(this);
        console.log('UA:' + ctx.depth + ' ' + this.constructor.name + ' t:' + this + ' o:' + other);
        if (ctx.depth > 11) {
            console.log('DEPTH');
            return new BottomVal();
        }
        if (other instanceof BottomVal) {
            return this.val = other;
        }
        //if (other instanceof RefVal) {
        //  return this.val = other.unify(this.val || this, ctx)
        //}
        let oval = other.val || other;
        let val;
        if (!this.val || this.val === this) {
            val = this.unifier(oval, ctx);
        }
        else {
            val = this.val.unify(oval, ctx);
        }
        if (!val) {
            val = new BottomVal();
        }
        console.log('UB:' + ctx.depth + ' ' + this.constructor.name + ' t:' + this + ' o:' + other + ' -> ' + val);
        return this.val = val;
    }
}
exports.Val = Val;
class TopVal extends Val {
    constructor(path) {
        super(path);
    }
    unifier(other, ctx) {
        if (other instanceof TopVal) {
            return this;
        }
        else {
            return other.unify(this, ctx);
        }
    }
    str() {
        return '$T';
    }
}
exports.TopVal = TopVal;
class BottomVal extends Val {
    // TODO: constructor that captures error
    constructor(path) {
        super(path);
    }
    unifier() {
        return this;
    }
    str() {
        return '$B';
    }
}
exports.BottomVal = BottomVal;
class IntTypeVal extends Val {
    constructor(path) {
        super(path);
    }
    unifier(other, ctx) {
        if (other instanceof TopVal) {
            return this;
        }
        else if (other instanceof MeetVal) {
            return other.unify(this, ctx);
        }
        else if (other instanceof IntScalarVal) {
            return other;
        }
        else if (other instanceof IntTypeVal) {
            return this;
        }
    }
    str() {
        return '$int';
    }
}
exports.IntTypeVal = IntTypeVal;
class IntScalarVal extends Val {
    constructor(scalar, path) {
        super(path);
        this.scalar = scalar;
    }
    unifier(other, ctx) {
        if (other instanceof TopVal) {
            return this;
        }
        else if (other instanceof MeetVal) {
            return other.unify(this, ctx);
        }
        else if (other instanceof RefVal) {
            return other.unify(this, ctx);
        }
        else if (other instanceof IntTypeVal) {
            return this;
        }
        else if (other instanceof IntScalarVal) {
            return other.scalar === this.scalar ? other : undefined;
        }
    }
    str() {
        return this.scalar.toString();
    }
}
exports.IntScalarVal = IntScalarVal;
class MeetVal extends Val {
    constructor(vals, path) {
        super(path);
        this.vals = vals;
    }
    unifier(other, ctx) {
        let cur = other;
        for (let vI = 0; vI < this.vals.length; vI++) {
            cur = this.vals[vI].unify(cur, ctx);
        }
        return cur;
    }
    str() {
        return this.vals.map(v => v.toString()).join(' & ');
    }
}
exports.MeetVal = MeetVal;
class RefVal extends Val {
    constructor(ref, path) {
        super(path);
        this.ref = ref;
    }
    unifier(other, ctx) {
        ctx.refs.push(this.ref);
        // TODO: unify with same
        // cycles cancel if path =/= ref ?
        let oval = other;
        if (oval instanceof RefVal) {
            if (oval.ref.equals(this.ref)) {
                return this.ref.resolve(ctx);
            }
            if (this.ref.equals(oval.path) && oval.ref.equals(this.path)) {
                return new TopVal(this.path);
            }
            oval = oval.ref.resolve(ctx);
            if (!oval) {
                return new MeetVal([
                    new RefVal(this.ref, this.path),
                    new RefVal(other.ref, this.path),
                ], this.path);
            }
        }
        let val = this.ref.resolve(ctx);
        if (val) {
            return val.unify(oval, ctx);
        }
        else {
            return new MeetVal([
                new RefVal(this.ref, this.path),
                other
            ], this.path);
        }
    }
    str() {
        return this.ref.str;
    }
}
exports.RefVal = RefVal;
class Path {
    constructor(parts) {
        this.parts = [];
        this.str = '';
        this.length = 0;
        parts = parts instanceof Path ? parts.parts : parts;
        this.parts = 'string' === typeof parts ? parts.split(/\./) : [...parts];
        this.length = this.parts.length;
        this.str = this.parts.join('.');
    }
    resolve(ctx) {
        let seen = ctx.refs.find(ref => ref.equals(this));
        return seen ? new TopVal(this) : ctx.pathmap[this.str];
    }
    append(other) {
        return new Path([...this.parts, ...other.parts]);
    }
    slice(n) {
        return new Path(this.parts.slice(n));
    }
    equals(other) {
        return other ? this.str === other.str : false;
    }
    deeper(other) {
        //return this.parts_str != other.parts_str &&
        return this.str.startsWith(other.str);
    }
    toString() {
        return this.str;
    }
}
exports.Path = Path;
//# sourceMappingURL=val.js.map