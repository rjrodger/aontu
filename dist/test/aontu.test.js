"use strict";
/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
let { Aontu, Lang, util } = require('../aontu');
// let { makeFileResolver } = require('@jsonic/multisource')
describe('aontu', function () {
    it('happy', async () => {
        let v0 = Aontu('a:1');
        expect(v0.canon).toEqual('{"a":1}');
        expect(Aontu('a:{b:1},a:{c:2}').canon).toEqual('{"a":{"b":1,"c":2}}');
        expect(Aontu('a:b:1,a:c:2').canon).toEqual('{"a":{"b":1,"c":2}}');
        expect(Aontu(`
a:{b:1}
a:{c:2}
`).canon).toEqual('{"a":{"b":1,"c":2}}');
        let p0 = new Lang();
        expect(p0.parse(`
u: { x: 1, y: number}
q: a: $.u
w: b: $.q.a & {y:2,z:3}
`).canon).toEqual('{"u":{"x":1,"y":number},"q":{"a":$.u},"w":{"b":$.q.a&{"y":2,"z":3}}}');
        expect(Aontu(`
q: a: { x: 1, y: number}
w0: b: $.q.a & {y:2,z:3}
w1: b: {y:2,z:3} & $.q.a
`).gen([])).toEqual({
            q: { a: { x: 1, y: undefined } },
            w0: { b: { x: 1, y: 2, z: 3 } },
            w1: { b: { x: 1, y: 2, z: 3 } },
        });
        // TODO: fix in jsonic
        expect(Aontu('{a:b:1\na:c:2}').canon).toEqual('{"a":{"b":1,"c":2}}');
    });
    it('util', async () => {
        expect(util.options('x')).toMatchObject({ src: 'x', print: 0 });
        expect(util.options('x', { print: 1 })).toMatchObject({ src: 'x', print: 1 });
        expect(util.options({ src: 'x' }, { print: 1 })).toMatchObject({
            src: 'x',
            print: 1,
        });
        expect(util.options({ src: 'x', print: 1 }, { src: 'y', print: 2 })).toMatchObject({ src: 'y', print: 2 });
    });
    it('file', async () => {
        let v0 = Aontu('@"' + __dirname + '/t02.jsonic"');
        expect(v0.canon).toEqual('{"sys":{"ent":{"name":string}},"ent":{"foo":{"name":"foo","fields":{"f0":{"kind":"string"}}},"bar":{"name":"bar","fields":{"f0":{"kind":"number"}}}}}');
        expect(v0.gen({ err: [] })).toEqual({
            sys: { ent: { name: undefined } },
            ent: {
                foo: {
                    name: 'foo',
                    fields: {
                        f0: {
                            kind: 'string',
                        },
                    },
                },
                bar: {
                    name: 'bar',
                    fields: {
                        f0: {
                            kind: 'number',
                        },
                    },
                },
            },
        });
    });
    it('pref', async () => {
        let v0 = Aontu('@"' + __dirname + '/t03.jsonic"', {
            // resolver: makeFileResolver(),
            base: __dirname,
        });
        // TODO: fix err msg
        // expect(v0.canon).toEqual(
        //   '{"uxc":{"name":string,"size":integer|*1},"foo":{"name":string,"size":integer|*1},"bar":{"name":"bar","size":integer|*1},"zed":{"name":"zed","size":2},"qaz":{"name":"bar","size":nil}}'
        // )
        // expect(v0.gen([])).toEqual({
        //   uxc: { name: undefined, size: 1 },
        //   foo: { name: undefined, size: 1 },
        //   bar: { name: 'bar', size: 1 },
        //   zed: { name: 'zed', size: 2 },
        //   qaz: { name: 'bar', size: undefined },
        // })
    });
    it('map-spread', () => {
        let v0 = Aontu('c:{&:{x:2},y:{k:3},z:{k:4}}');
        expect(v0.canon).toEqual('{"c":{&:{"x":2},"y":{"k":3,"x":2},"z":{"k":4,"x":2}}}');
        let v1 = Aontu('c:{&:{x:2},z:{k:4}},c:{y:{k:3}}');
        expect(v1.canon).toEqual('{"c":{&:{"x":2},"z":{"k":4,"x":2},"y":{"k":3,"x":2}}}');
        let v10 = Aontu('a:{&:{x:1}},b:.a,b:{y:{k:2}},c:{&:{x:2}},c:{y:{k:3}}');
        expect(v10.canon).toEqual('{"a":{&:{"x":1}},' +
            '"b":{&:{"x":1},"y":{"k":2,"x":1}},' +
            '"c":{&:{"x":2},"y":{"k":3,"x":2}}}');
    });
    it('empty-and-comments', () => {
        expect(Aontu('').gen()).toEqual({});
        expect(Aontu().gen()).toEqual({});
        expect(Aontu(`
    # comment
    `).gen()).toEqual({});
    });
    it('spread-edges', () => {
        expect(Aontu('a:b:{} a:&:{x:1}').gen()).toEqual({ a: { b: { x: 1 } } });
        // FIX
        // expect(Aontu('a:{} &:{x:1}').gen()).toEqual({ a: { x: 1 } })
    });
    it('key-edges', () => {
        expect(Aontu('a:{k:.$KEY}').gen()).toEqual({ a: { k: 'a' } });
        expect(Aontu('a:b:{k:.$KEY}').gen()).toEqual({ a: { b: { k: 'b' } } });
        expect(Aontu('a:{k:.$KEY} x:1').gen()).toEqual({ x: 1, a: { k: 'a' } });
        expect(Aontu('a:b:{k:.$KEY} x:1').gen()).toEqual({ x: 1, a: { b: { k: 'b' } } });
        expect(Aontu('x:1 a:{k:.$KEY}').gen()).toEqual({ x: 1, a: { k: 'a' } });
        expect(Aontu('x:1 a:b:{k:.$KEY}').gen()).toEqual({ x: 1, a: { b: { k: 'b' } } });
    });
    it('practical-path-spread', () => {
        let v0 = Aontu(`
micks: $.def.garage & {

  porsche: {
    color: silver
  }

  ferrari: {
    color: red
  }

  telsa: {
  }
}

def: car: {
  doors: *4 | number
  color: *green | string
}

def: garage: {
  &: $.def.car
}
`);
        expect(v0.gen()).toEqual({
            micks: {
                porsche: { doors: 4, color: 'silver' },
                ferrari: { doors: 4, color: 'red' },
                telsa: { doors: 4, color: 'green' }
            },
            def: { car: { doors: 4, color: 'green' }, garage: {} }
        });
    });
});
//# sourceMappingURL=aontu.test.js.map