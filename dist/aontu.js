"use strict";
/* Copyright (c) 2020 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseNode = exports.parseVal = exports.bottom = exports.defer = exports.top = exports.ListVal = exports.MapVal = exports.NodesVal = exports.RefVal = exports.IntScalarVal = exports.IntTypeVal = exports.BottomVal = exports.Path = exports.Node = exports.reify = exports.unify = void 0;
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
function unify(orignodes) {
    let meta = { s: Date.now(), d: 0 };
    let nodes = orignodes
        .map((n) => {
        if ('string' === typeof n) {
            return parseNode(n);
        }
        else {
            return n.clone();
        }
    });
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
    let pathmap = {};
    // merge same path values
    nodes = nodes.reduce((out, n, i, nodes) => {
        //let prev = nodes[i - 1]
        //if (prev && n.path.equals(prev.path)) {
        let prev = pathmap[n.path.parts_str];
        if (prev) {
            prev.vals.splice(prev.vals.length, 0, ...n.vals);
        }
        else {
            out.push(n);
            pathmap[n.path.parts_str] = n;
        }
        return out;
    }, []);
    let root_ctx = {
        path: new Path([]),
        nodes: nodes,
        index: 0
    };
    let origlen = nodes.length;
    // FIX: max val is just a hack to stop infinit loops
    for (let nI = 0; nI < nodes.length && nI < 11 * origlen; nI++) {
        let node = nodes[nI];
        if (!node) {
            break;
        }
        root_ctx.index = nI;
        let resnodes = node.unify(root_ctx);
        // TODO: search pathmap, and append vals if path matches
        nodes.push(...resnodes);
    }
    meta.d = Date.now() - meta.s;
    nodes.$meta = meta;
    return nodes;
}
exports.unify = unify;
function reify(nodes) {
    let out = {};
    for (let nI = 0; nI < nodes.length; nI++) {
        let node = nodes[nI];
        inject(out, node.path.parts, node.val);
    }
    return out;
}
exports.reify = reify;
function inject(obj, parts, val) {
    if (null == val)
        return;
    let cur = obj;
    for (let pI = 0; pI < parts.length; pI++) {
        cur = cur[parts[pI]] =
            cur[parts[pI]] ||
                (pI < parts.length - 1
                    ? {}
                    : // TODO: should be Val.reify()
                        val.scalar);
    }
}
function resolve(path, ctx) {
    // TODO: use pathmap (overwrite refvals!)
    let index = ctx.nodes.findIndex((n) => {
        return path.equals(n.path) && null != n.val;
    });
    let node = ctx.nodes[index];
    let val = node ? node.val : undefined;
    if (val instanceof MapVal) {
        val = new NodesVal(index, path, ctx.nodes[ctx.index].path);
    }
    return val;
}
class Node {
    constructor(path, vals) {
        this.path = new Path(path);
        this.vals =
            'string' === typeof vals
                ? parseVals(vals)
                : vals.map((v) => {
                    if ('string' === typeof v) {
                        return parseVal(v);
                    }
                    else {
                        return v;
                    }
                });
    }
    clone(to) {
        let cn = new Node(to || this.path, this.vals);
        cn.val = this.val;
        return cn;
    }
    unify(root_ctx) {
        if (this.val)
            return [];
        let ctx = Object.assign(Object.assign({}, root_ctx), { path: this.path });
        let val = top;
        for (let vI = 0; vI < this.vals.length; vI++) {
            val = val.unify(this.vals[vI], ctx);
            if (!val) {
                break;
            }
        }
        if (val instanceof DeferVal) {
            return [this];
        }
        else if (val instanceof NodesVal) {
            return val.nodes;
        }
        else {
            this.val = val;
            return [];
        }
    }
    toString() {
        return this.path.parts_str + ': ' + this.val + ' # ' + this.vals;
    }
}
exports.Node = Node;
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
exports.Path = Path;
function parseNode(s) {
    let [pathstr, valstr] = s.split(':');
    return new Node(pathstr, valstr);
}
exports.parseNode = parseNode;
function parseVal(s) {
    let val = bottom;
    s = s.trim();
    let n = parseInt(s);
    if (!isNaN(n)) {
        return new IntScalarVal(n);
    }
    if ('int' === s) {
        return new IntTypeVal();
    }
    if (s.startsWith('{}')) {
        return new MapVal();
    }
    if (s.startsWith('[]')) {
        return new ListVal();
    }
    if (s.startsWith('$')) {
        return new RefVal(new Path(s));
    }
    return val;
}
exports.parseVal = parseVal;
function parseVals(s) {
    return s
        .split(/\s*,\s*/)
        .filter((vs) => '' !== vs)
        .map((vs) => parseVal(vs));
}
class TopVal {
    unify(other, ctx) {
        return other.unify(this, ctx);
    }
    toString() {
        return 'top';
    }
}
const top = new TopVal();
exports.top = top;
class BottomVal {
    unify() {
        return this;
    }
    toString() {
        return 'bottom';
    }
}
exports.BottomVal = BottomVal;
const bottom = new BottomVal();
exports.bottom = bottom;
class DeferVal {
    unify(other) {
        return other instanceof BottomVal ? other : this;
    }
    toString() {
        return 'defer';
    }
}
const defer = new DeferVal();
exports.defer = defer;
class IntTypeVal {
    unify(other) {
        let out = bottom;
        if (other instanceof TopVal) {
            return this;
        }
        else if (other instanceof IntScalarVal) {
            out = other;
        }
        else if (other instanceof IntTypeVal) {
            out = other;
        }
        return out;
    }
    toString() {
        return 'int';
    }
}
exports.IntTypeVal = IntTypeVal;
class IntScalarVal {
    constructor(val) {
        this.scalar = val;
    }
    unify(other) {
        let out = bottom;
        if (other instanceof TopVal) {
            return this;
        }
        else if (other instanceof IntScalarVal) {
            return other.scalar === this.scalar ? other : bottom;
        }
        else if (other instanceof IntTypeVal) {
            return this;
        }
        return out;
    }
    toString() {
        return 'int=' + this.scalar;
    }
}
exports.IntScalarVal = IntScalarVal;
class RefVal {
    constructor(path) {
        this.val = undefined;
        this.path = path;
    }
    unify(other, ctx) {
        let out = defer;
        // TODO: unify with same
        this.val = resolve(this.path, ctx);
        if (this.val) {
            out = this.val = this.val.unify(other, ctx);
        }
        return out;
    }
    toString() {
        return this.path.parts_str;
    }
}
exports.RefVal = RefVal;
class NodesVal {
    constructor(from_index, from, to) {
        this.from_index = from_index;
        this.from = from;
        this.to = to;
        this.nodes = [];
    }
    unify(other, ctx) {
        let out = bottom;
        if (other instanceof TopVal) {
            let index = this.from_index;
            // FIX: doesn't really work as misses earlier values
            while (ctx.nodes[index].path.deeper(this.from)) {
                let suffix = ctx.nodes[index].path.slice(this.from.length);
                // console.log('sx', this.from, this.from.length, '' + suffix)
                let to = this.to.append(suffix);
                this.nodes.push(ctx.nodes[index].clone(to));
                index++;
            }
            return this;
        }
        return out;
    }
    toString() {
        return 'N=' + this.from_index + '~' + this.to.parts_str + ':' + this.from.parts_str;
    }
}
exports.NodesVal = NodesVal;
class MapVal {
    unify(other) {
        let out = bottom;
        if (other instanceof TopVal) {
            return this;
        }
        else if (other instanceof MapVal) {
            return other;
        }
        return out;
    }
    toString() {
        return '{}';
    }
}
exports.MapVal = MapVal;
class ListVal {
    unify(other) {
        let out = bottom;
        if (other instanceof TopVal) {
            return this;
        }
        else if (other instanceof ListVal) {
            return other;
        }
        return out;
    }
    toString() {
        return '{}';
    }
}
exports.ListVal = ListVal;
//# sourceMappingURL=aontu.js.map