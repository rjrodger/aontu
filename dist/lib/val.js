"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefVal = exports.DisjunctVal = exports.ConjunctVal = exports.MapVal = exports.IntegerVal = exports.BooleanVal = exports.StringVal = exports.NumberVal = exports.ScalarTypeVal = exports.Nil = exports.TOP = exports.Val = exports.Integer = void 0;
const DONE = -1;
// There can be only one.
const TOP = {
    top: true,
    val: undefined,
    done: DONE,
    unify(peer, _ctx) {
        if (peer instanceof DisjunctVal) {
            return peer.unify(this);
        }
        else if (peer instanceof ConjunctVal) {
            return peer.unify(this);
        }
        else if (peer instanceof RefVal) {
            return peer.unify(this);
        }
        else {
            return peer;
        }
    },
    get canon() { return 'top'; },
    get dc() { return 'top'; },
    gen: (_log) => {
        // TOPs evaporate
        return undefined;
    },
};
exports.TOP = TOP;
const UNIFIER = (self, peer, ctx) => {
    if (peer === TOP) {
        return self;
    }
    else if (self === TOP) {
        return peer;
    }
    else if (self.constructor === peer.constructor) {
        return self.val === peer.val ? self :
            new Nil('no-unify-val:[' + self.canon + ',' + peer.canon + ']');
    }
    else if (peer instanceof Nil) {
        return peer;
    }
    else if (self instanceof Nil) {
        return self;
    }
    else if (peer instanceof DisjunctVal) {
        return peer.unify(self, ctx);
    }
    else if (peer instanceof ConjunctVal) {
        return peer.unify(self, ctx);
    }
    else if (peer instanceof RefVal) {
        return peer.unify(self, ctx);
    }
    else {
        return new Nil('no-unify:' + self.canon + ',' + peer.canon);
    }
};
class Val {
    constructor(val) {
        this.done = 0;
        this.val = val;
    }
    get dc() {
        return this.canon + '/*d' + this.done + '*/';
    }
}
exports.Val = Val;
class Nil extends Val {
    constructor(why) {
        super();
        this.why = why;
        this.done = DONE;
    }
    unify(_peer, _ctx) {
        return this;
    }
    get canon() {
        return 'nil:' + this.why;
    }
    gen(log) {
        // This is an error.
        log.push('nil');
        return undefined;
    }
}
exports.Nil = Nil;
class Integer {
}
exports.Integer = Integer;
class ScalarTypeVal extends Val {
    constructor(val) {
        super(val);
        this.done = DONE;
    }
    unify(peer, _ctx) {
        if (peer instanceof ScalarVal) {
            if (peer.type === this.val) {
                //console.log('AAA')
                return peer;
            }
            else if (Number === this.val && Integer === peer.type) {
                return peer;
            }
            else {
                return new Nil('no-scalar-unify');
            }
        }
        else {
            if (peer instanceof ScalarTypeVal) {
                if (Number === this.val && Integer === peer.val) {
                    return peer;
                }
                else if (Number === peer.val && Integer === this.val) {
                    return this;
                }
            }
            return UNIFIER(this, peer);
        }
    }
    get canon() {
        return this.val.name.toLowerCase();
    }
    gen(log) {
        // This is an error.
        log.push('ScalarTypeVal<' + this.canon + '>');
        return undefined;
    }
}
exports.ScalarTypeVal = ScalarTypeVal;
class ScalarVal extends Val {
    constructor(val, type) {
        super(val);
        this.type = type;
        this.done = DONE;
    }
    unify(peer, _ctx) {
        if (peer instanceof ScalarTypeVal) {
            return peer.unify(this);
        }
        else {
            return UNIFIER(this, peer);
        }
    }
    get canon() {
        return this.val.toString();
    }
    gen(_log) {
        return this.val;
    }
}
class NumberVal extends ScalarVal {
    constructor(val) {
        super(val, Number);
    }
    unify(peer, _ctx) {
        if (peer instanceof ScalarVal && peer.type === Integer) {
            return peer;
        }
        else {
            return super.unify(peer);
        }
    }
}
exports.NumberVal = NumberVal;
class IntegerVal extends ScalarVal {
    constructor(val) {
        if (!Number.isInteger(val)) {
            throw new Error('not-integer');
        }
        super(val, Integer);
    }
    unify(peer, _ctx) {
        if (peer instanceof ScalarTypeVal && peer.val === Number) {
            return this;
        }
        else if (peer instanceof ScalarVal &&
            peer.type === Number &&
            this.val === peer.val) {
            return this;
        }
        else {
            return super.unify(peer);
        }
    }
}
exports.IntegerVal = IntegerVal;
class StringVal extends ScalarVal {
    constructor(val) {
        super(val, String);
    }
    unify(peer, _ctx) {
        return super.unify(peer);
    }
    get canon() {
        return JSON.stringify(this.val);
    }
}
exports.StringVal = StringVal;
class BooleanVal extends ScalarVal {
    constructor(val) {
        super(val, Boolean);
    }
    unify(peer) {
        return super.unify(peer);
    }
}
exports.BooleanVal = BooleanVal;
BooleanVal.TRUE = new BooleanVal(true);
BooleanVal.FALSE = new BooleanVal(false);
class MapVal extends Val {
    constructor(val) {
        super(val);
        this.id = 'v' + ('' + Math.random()).substr(3, 5);
    }
    // NOTE: order of keys is not preserved!
    // not possible in any case - consider {a,b} unify {b,a}
    unify(peer, ctx) {
        let done = true;
        let out = this;
        if (DONE !== this.done) {
            out = new MapVal({});
            out.done = this.done + 1;
            // Always unify children against TOP first
            for (let key in this.val) {
                out.val[key] = this.val[key].unify(TOP, ctx);
                done = (done && DONE === out.val[key].done);
            }
        }
        if (peer instanceof MapVal) {
            let upeer = peer.unify(TOP, ctx);
            for (let peerkey in upeer.val) {
                let peerchild = upeer.val[peerkey];
                let child = this.val[peerkey];
                out.val[peerkey] =
                    undefined === child ? peerchild : child.unify(peerchild, ctx);
                done = (done && DONE === out.val[peerkey].done);
            }
            out.done = done ? DONE : out.done;
            return out;
        }
        else {
            out.done = done ? DONE : out.done;
            return UNIFIER(out, peer);
        }
    }
    get canon() {
        return '{' + Object.keys(this.val)
            .map(k => [JSON.stringify(k) + ':' + this.val[k].canon]).join(',') + '}';
    }
    gen(log) {
        let out = {};
        for (let p in this.val) {
            out[p] = this.val[p].gen(log);
        }
        return out;
    }
}
exports.MapVal = MapVal;
class ConjunctVal extends Val {
    constructor(val) {
        super(val);
    }
    append(peer) {
        return new ConjunctVal([...this.val, peer]);
    }
    prepend(peer) {
        return new ConjunctVal([peer, ...this.val]);
    }
    unify(peer, ctx) {
        let done = true;
        let upeer = [];
        for (let vI = 0; vI < this.val.length; vI++) {
            upeer[vI] = this.val[vI].unify(peer, ctx);
            done = done && DONE === upeer[vI].done;
            console.log('Ca', vI, this.val[vI].canon, peer.canon, upeer[vI].canon);
            if (upeer[vI] instanceof Nil) {
                return new Nil('&peer[' + upeer[vI].canon + ',' + peer.canon + ']');
            }
        }
        console.log('Cb', ...upeer.map(x => x.canon));
        let outvals = 0 < upeer.length ? [upeer[0]] : [];
        let oI = 0;
        for (let uI = 1; uI < upeer.length; uI++) {
            if (outvals[oI] instanceof ConjunctVal) {
                outvals.splice(oI, 0, ...outvals[oI].val);
                oI += outvals[oI].val.length;
                done = false;
            }
            else {
                outvals[oI] = null == outvals[oI] ? upeer[uI] :
                    outvals[oI].unify(upeer[uI], ctx);
                done = done && DONE === outvals[oI].done;
                if (outvals[oI] instanceof Nil) {
                    return new Nil('&reduce[' + outvals[oI].canon + ',' + upeer[uI].canon + ']');
                }
            }
        }
        let out;
        if (0 === outvals.length) {
            out = new Nil('&empty');
        }
        else if (1 === outvals.length) {
            out = outvals[0];
        }
        else {
            out = new ConjunctVal(outvals);
        }
        out.done = done ? DONE : this.done + 1;
        return out;
    }
    get canon() {
        return this.val.map((v) => v.canon).join('&');
    }
    gen(log) {
        if (0 < this.val.length) {
            // Default is just the first term - does this work?
            // TODO: maybe use a PrefVal() ?
            let v = this.val[0];
            let out = undefined;
            if (undefined !== v && !(v instanceof Nil)) {
                out = v.gen(log);
            }
            else {
                log.push('nil:|:none=' + this.canon);
            }
            return out;
        }
        else {
            log.push('nil:|:empty=' + this.canon);
            return undefined;
        }
    }
}
exports.ConjunctVal = ConjunctVal;
class DisjunctVal extends Val {
    constructor(val) {
        super(val);
    }
    append(peer) {
        return new DisjunctVal([...this.val, peer]);
    }
    prepend(peer) {
        return new DisjunctVal([peer, ...this.val]);
    }
    unify(peer, ctx) {
        let out = [];
        for (let vI = 0; vI < this.val.length; vI++) {
            out[vI] = this.val[vI].unify(peer, ctx);
        }
        out = out.filter(v => !(v instanceof Nil));
        return new DisjunctVal(out);
    }
    get canon() {
        return this.val.map((v) => v.canon).join('|');
    }
    gen(log) {
        if (0 < this.val.length) {
            // Default is just the first term - does this work?
            // TODO: maybe use a PrefVal() ?
            let v = this.val[0];
            /*
            for (let vI = 1; vI < this.val.length; vI++) {
              if (v instanceof Nil) {
                v = this.val[vI]
              }
              else if (!(this.val[vI] instanceof Nil)) {
                v = this.val[vI].unify(v)
              }
            }
      
            console.log('DJ', v)
            */
            let out = undefined;
            if (undefined !== v && !(v instanceof Nil)) {
                out = v.gen(log);
            }
            else {
                log.push('nil:|:none=' + this.canon);
            }
            return out;
        }
        else {
            log.push('nil:|:empty=' + this.canon);
            return undefined;
        }
    }
}
exports.DisjunctVal = DisjunctVal;
class RefVal extends Val {
    constructor(val) {
        super(val);
        this.parts = val.split('/').filter(p => '' != p);
        this.absolute = val.startsWith('/');
    }
    append(part) {
        this.parts.push(part);
        this.val = (this.absolute ? '/' : '') + this.parts.join('/');
    }
    unify(peer, ctx) {
        let resolved = null == ctx ? this : (ctx.find(this) || this);
        let out;
        if (resolved instanceof RefVal) {
            if (TOP === peer) {
                out = new RefVal(this.val);
            }
            else if (peer instanceof Nil) {
                out = new Nil('ref[' + this.val + ']');
            }
            else {
                out = new ConjunctVal([this, peer]);
            }
        }
        else {
            out = resolved.unify(peer, ctx);
        }
        out.done = DONE === out.done ? DONE : this.done + 1;
        console.log('RefVal.unify', this.val, resolved, peer, out);
        return out;
    }
    get canon() {
        return this.val;
    }
    gen(log) {
        log.push(this.canon);
        return undefined;
    }
}
exports.RefVal = RefVal;
//# sourceMappingURL=val.js.map