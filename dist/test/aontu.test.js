"use strict";
/* Copyright (c) 2020-2025 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
const memfs_1 = require("memfs");
const code_1 = require("@hapi/code");
let { Aontu, Lang, util } = require('../aontu');
// let { makeFileResolver } = require('@jsonic/multisource')
describe('aontu', function () {
    it('happy', async () => {
        let v0 = Aontu('a:1');
        (0, code_1.expect)(v0.canon).equal('{"a":1}');
        (0, code_1.expect)(Aontu('a:{b:1},a:{c:2}').canon).equal('{"a":{"b":1,"c":2}}');
        (0, code_1.expect)(Aontu('a:b:1,a:c:2').canon).equal('{"a":{"b":1,"c":2}}');
        (0, code_1.expect)(Aontu(`
a:{b:1}
a:{c:2}
`).canon).equal('{"a":{"b":1,"c":2}}');
        let p0 = new Lang();
        (0, code_1.expect)(p0.parse(`
u: { x: 1, y: number}
q: a: $.u
w: b: $.q.a & {y:2,z:3}
`).canon).equal('{"u":{"x":1,"y":number},"q":{"a":$.u},"w":{"b":$.q.a&{"y":2,"z":3}}}');
        (0, code_1.expect)(Aontu(`
q: a: { x: 1, y: number}
w0: b: $.q.a & {y:2,z:3}
w1: b: {y:2,z:3} & $.q.a
`).gen([])).equal({
            q: { a: { x: 1, y: undefined } },
            w0: { b: { x: 1, y: 2, z: 3 } },
            w1: { b: { x: 1, y: 2, z: 3 } },
        });
        // TODO: fix in jsonic
        (0, code_1.expect)(Aontu('{a:b:1\na:c:2}').canon).equal('{"a":{"b":1,"c":2}}');
    });
    it('util', async () => {
        (0, code_1.expect)(util.options('x')).include({ src: 'x', print: 0 });
        (0, code_1.expect)(util.options('x', { print: 1 })).include({ src: 'x', print: 1 });
        (0, code_1.expect)(util.options({ src: 'x' }, { print: 1 })).include({
            src: 'x',
            print: 1,
        });
        (0, code_1.expect)(util.options({ src: 'x', print: 1 }, { src: 'y', print: 2 })).include({ src: 'y', print: 2 });
    });
    it('file', async () => {
        let v0 = Aontu('@"' + __dirname + '/t02.jsonic"');
        (0, code_1.expect)(v0.canon).equal('{"sys":{"ent":{"name":string}},"ent":{"foo":{"name":"foo","fields":{"f0":{"kind":"string"}}},"bar":{"name":"bar","fields":{"f0":{"kind":"number"}}}}}');
        (0, code_1.expect)(v0.gen({ err: [] })).equal({
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
        (0, code_1.expect)(v0.canon).equal('{"c":{&:{"x":2},"y":{"k":3,"x":2},"z":{"k":4,"x":2}}}');
        let v1 = Aontu('c:{&:{x:2},z:{k:4}},c:{y:{k:3}}');
        (0, code_1.expect)(v1.canon).equal('{"c":{&:{"x":2},"z":{"k":4,"x":2},"y":{"k":3,"x":2}}}');
        let v10 = Aontu('a:{&:{x:1}},b:.a,b:{y:{k:2}},c:{&:{x:2}},c:{y:{k:3}}');
        (0, code_1.expect)(v10.canon).equal('{"a":{&:{"x":1}},' +
            '"b":{&:{"x":1},"y":{"k":2,"x":1}},' +
            '"c":{&:{"x":2},"y":{"k":3,"x":2}}}');
    });
    it('empty-and-comments', () => {
        (0, code_1.expect)(Aontu('').gen()).equal({});
        (0, code_1.expect)(Aontu().gen()).equal({});
        (0, code_1.expect)(Aontu(`
    # comment
    `).gen()).equal({});
    });
    it('spread-edges', () => {
        (0, code_1.expect)(Aontu('a:b:{} a:&:{x:1}').gen()).equal({ a: { b: { x: 1 } } });
        // FIX
        // expect(Aontu('a:{} &:{x:1}').gen()).toEqual({ a: { x: 1 } })
    });
    it('key-edges', () => {
        (0, code_1.expect)(Aontu('a:{k:.$KEY}').gen()).equal({ a: { k: 'a' } });
        (0, code_1.expect)(Aontu('a:b:{k:.$KEY}').gen()).equal({ a: { b: { k: 'b' } } });
        (0, code_1.expect)(Aontu('a:{k:.$KEY} x:1').gen()).equal({ x: 1, a: { k: 'a' } });
        (0, code_1.expect)(Aontu('a:b:{k:.$KEY} x:1').gen()).equal({ x: 1, a: { b: { k: 'b' } } });
        (0, code_1.expect)(Aontu('x:1 a:{k:.$KEY}').gen()).equal({ x: 1, a: { k: 'a' } });
        (0, code_1.expect)(Aontu('x:1 a:b:{k:.$KEY}').gen()).equal({ x: 1, a: { b: { k: 'b' } } });
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
        (0, code_1.expect)(v0.gen()).equal({
            micks: {
                porsche: { doors: 4, color: 'silver' },
                ferrari: { doors: 4, color: 'red' },
                telsa: { doors: 4, color: 'green' }
            },
            def: { car: { doors: 4, color: 'green' }, garage: {} }
        });
    });
    it('virtual-fs', () => {
        const { fs } = (0, memfs_1.memfs)({
            'foo.jsonic': '{f:11}'
        });
        let v0 = Aontu(`a:@"/foo.jsonic"`, { fs });
        (0, code_1.expect)(v0.canon).equal('{"a":{"f":11}}');
        let v1 = Aontu(`a:@"foo.jsonic"`, { fs, path: '/' });
        (0, code_1.expect)(v1.canon).equal('{"a":{"f":11}}');
    });
});
//# sourceMappingURL=aontu.test.js.map