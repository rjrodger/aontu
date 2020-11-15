"use strict";
/* Copyright (c) 2020 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefVal = exports.MeetVal = exports.MapVal = exports.IntScalarVal = exports.IntTypeVal = exports.BottomVal = exports.TopVal = exports.Context = void 0;
class Context {
    constructor() {
        this.pathmap = {};
    }
}
exports.Context = Context;
class TopVal {
    unify(other, ctx) {
        return other.unify(this, ctx);
    }
    clone() {
        return new TopVal();
    }
    toString() {
        return '$T';
    }
}
exports.TopVal = TopVal;
class BottomVal {
    // TODO: constructor that captures error
    unify() {
        return new BottomVal();
    }
    clone() {
        return new BottomVal();
    }
    toString() {
        return '$B';
    }
}
exports.BottomVal = BottomVal;
class IntTypeVal {
    unify(other) {
        let out = new BottomVal();
        if (other instanceof TopVal) {
            return this.clone();
        }
        else if (other instanceof IntScalarVal) {
            out = other.clone();
        }
        else if (other instanceof IntTypeVal) {
            out = other.clone();
        }
        return out;
    }
    clone() {
        return new IntTypeVal();
    }
    toString() {
        return '$int';
    }
}
exports.IntTypeVal = IntTypeVal;
class IntScalarVal {
    constructor(scalar) {
        this.scalar = scalar;
    }
    unify(other) {
        let out = new BottomVal();
        other = other || new TopVal();
        if (other instanceof TopVal) {
            return this.clone();
        }
        else if (other instanceof IntScalarVal) {
            return other.scalar === this.scalar ? other.clone() : new BottomVal();
        }
        else if (other instanceof IntTypeVal) {
            return this;
        }
        return out;
    }
    clone() {
        return new IntScalarVal(this.scalar);
    }
    toString() {
        return this.scalar.toString();
    }
}
exports.IntScalarVal = IntScalarVal;
class MapVal {
    constructor(map) {
        this.map = map;
    }
    unify(other, ctx) {
        let out = new BottomVal();
        if (other instanceof TopVal) {
            let map = {};
            let fields = Object.keys(this.map);
            for (let fI = 0; fI < fields.length; fI++) {
                let fn = fields[fI];
                map[fn] = this.map[fn].unify(other, ctx);
            }
            return new MapVal(map);
        }
        else if (other instanceof MapVal) {
            let map = {};
            let ofields = Object.keys(other.map);
            for (let ofI = 0; ofI < ofields.length; ofI++) {
                let ofn = ofields[ofI];
                let ofv = other.map[ofn];
                let fv = this.map[ofn];
                let uv = null == fv ? ofv : ofv.unify(fv, ctx);
                map[ofn] = uv;
            }
            let fields = Object.keys(this.map);
            for (let fI = 0; fI < fields.length; fI++) {
                let fn = fields[fI];
                if (null == other.map[fn]) {
                    map[fn] = this.map[fn];
                }
            }
            return new MapVal(map);
        }
        return out;
    }
    clone() {
        let map = {};
        let fields = Object.keys(this.map);
        for (let fI = 0; fI < fields.length; fI++) {
            let fn = fields[fI];
            map[fn] = this.map[fn].clone();
        }
        return new MapVal(map);
    }
    toString() {
        let b = ['{'];
        let fields = Object.keys(this.map);
        for (let fI = 0; fI < fields.length; fI++) {
            let fn = fields[fI];
            b.push(fn, ':', this.map[fn].toString(), ',');
        }
        b.push('}');
        return b.join('');
    }
}
exports.MapVal = MapVal;
class MeetVal {
    constructor(vals) {
        this.vals = vals;
    }
    unify(other, ctx) {
        let out = new BottomVal();
        let meets = [];
        let cur = new TopVal();
        for (let vI = 0; vI < this.vals.length; vI++) {
            let val = this.vals[vI].unify(other, ctx);
            // returns MeetVal if children cannot yet unify due to unresolved refs
            if (val instanceof MeetVal) {
                meets.push(val);
            }
            else {
                cur = cur.unify(val, ctx);
                if (cur instanceof MeetVal) {
                    meets.push(cur);
                    cur = new TopVal();
                }
            }
        }
        if (0 == meets.length) {
            out = cur;
        }
        else {
            out = new MeetVal([cur, ...meets]);
        }
        return out;
    }
    clone() {
        return new MeetVal(this.vals.map(val => val.clone()));
    }
    toString() {
        return this.vals.map(v => v.toString()).join(' & ');
    }
}
exports.MeetVal = MeetVal;
class RefVal {
    constructor(path) {
        this.path = path instanceof Path ? path : new Path(path);
    }
    unify(other, ctx) {
        let out;
        // TODO: unify with same
        let val = this.path.resolve(ctx);
        if (val) {
            out = val.unify(other, ctx);
        }
        else {
            out = this.clone();
        }
        return out;
    }
    clone() {
        return new RefVal(this.path);
    }
    toString() {
        return this.path.parts_str;
    }
}
exports.RefVal = RefVal;
class Path {
    constructor(parts) {
        this.parts = [];
        this.parts_str = '';
        this.length = 0;
        parts = parts instanceof Path ? parts.parts : parts;
        this.parts = 'string' === typeof parts ? parts.split(/\./) : [...parts];
        this.length = this.parts.length;
        this.parts_str = this.parts.join('.');
    }
    resolve(ctx) {
        return ctx.pathmap[this.parts_str];
    }
    append(other) {
        return new Path([...this.parts, ...other.parts]);
    }
    slice(n) {
        return new Path(this.parts.slice(n));
    }
    equals(other) {
        return this.parts_str === other.parts_str;
    }
    deeper(other) {
        //return this.parts_str != other.parts_str &&
        return this.parts_str.startsWith(other.parts_str);
    }
    toString() {
        return this.parts_str;
    }
}
//# sourceMappingURL=val.js.map