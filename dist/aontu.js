"use strict";
/* Copyright (c) 2020 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseVal = exports.bottom = exports.RefVal = exports.IntScalarVal = exports.IntTypeVal = exports.BottomVal = exports.Path = exports.Node = exports.reify = exports.unify = void 0;
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
            return Node.clone(n);
        }
    })
        .sort((a, b) => {
        let plen = a.path.parts.length - b.path.parts.length;
        return 0 === plen
            ? a.path.parts_str < b.path.parts_str
                ? -1
                : a.path.parts_str > b.path.parts_str
                    ? 1
                    : 0
            : plen;
    });
    nodes = nodes.reduce((out, n, i, nodes) => {
        let prev = nodes[i - 1];
        if (prev && n.path.equals(prev.path)) {
            prev.vals.splice(prev.vals.length, 0, ...n.vals);
        }
        else {
            out.push(n);
        }
        return out;
    }, []);
    let root_ctx = {
        path: new Path([]),
        nodes: nodes,
    };
    let origlen = nodes.length;
    for (let nI = 0; nI < nodes.length && nI < 11 * origlen; nI++) {
        let node = nodes[nI];
        if (!node) {
            break;
        }
        let val = node.unify(root_ctx);
        if (undefined === val) {
            nodes.push(node);
        }
    }
    meta.d = Date.now() - meta.s;
    nodes.$meta = meta;
    return nodes.slice(0, origlen);
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
function resolve(path, nodes) {
    let node = nodes.find((n) => path.equals(n.path));
    return node ? node.val : undefined;
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
    static clone(node) {
        return new Node(node.path, node.vals);
    }
    unify(root_ctx) {
        if (this.val)
            return this.val;
        let ctx = Object.assign(Object.assign({}, root_ctx), { path: this.path });
        let val = top;
        for (let vI = 0; vI < this.vals.length; vI++) {
            val = val.unify(this.vals[vI], ctx);
            if (!val) {
                break;
            }
        }
        if (val) {
            this.val = val;
        }
        return this.val;
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
        parts = parts instanceof Path ? parts.parts : parts;
        this.parts = 'string' === typeof parts ? parts.split(/\./) : [...parts];
        this.parts_str = this.parts.join('.');
    }
    equals(other) {
        return this.parts_str === other.parts_str;
    }
    deeper(other) {
        return this.parts.length > other.parts.length;
    }
}
exports.Path = Path;
function parseNode(s) {
    let [pathstr, valstr] = s.split(':');
    return new Node(pathstr, valstr);
}
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
    unify(other, ctx) {
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
        let out = undefined;
        this.val = resolve(this.path, ctx.nodes);
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
//# sourceMappingURL=aontu.js.map