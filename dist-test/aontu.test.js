"use strict";
/* Copyright (c) 2020-2025 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const memfs_1 = require("memfs");
const code_1 = require("@hapi/code");
const aontu_1 = require("../dist/aontu");
(0, node_test_1.describe)('aontu', function () {
    (0, node_test_1.it)('basic-api', async () => {
        let a0 = new aontu_1.AontuX();
        let p0 = a0.parse('a:number');
        (0, code_1.expect)(p0.canon).equal('{"a":number}');
        let v0 = a0.unify('a:1');
        (0, code_1.expect)(v0.canon).equal('{"a":1}');
        let v0a = a0.unify(v0);
        (0, code_1.expect)(v0a.canon).equal('{"a":1}');
        let d0 = a0.generate('a:2');
        (0, code_1.expect)(d0).equal({ a: 2 });
    });
    (0, node_test_1.it)('error-api', async () => {
        let a0 = new aontu_1.AontuX();
        (0, code_1.expect)(() => a0.parse('a::number')).throws('QQQ');
        (0, code_1.expect)(a0.parse('a:number a:A').canon).equal('WWW');
        (0, code_1.expect)(() => a0.unify('a::1')).throws('QQQ');
        (0, code_1.expect)(() => a0.unify('a:1 a:2')).throws('QQQ');
        (0, code_1.expect)(() => a0.generate('a::A')).throws('QQQ');
        (0, code_1.expect)(() => a0.generate('a:A a:B')).throws('QQQ');
    });
    (0, node_test_1.it)('happy', async () => {
        let v0 = (0, aontu_1.Aontu)('a:1');
        (0, code_1.expect)(v0.canon).equal('{"a":1}');
        (0, code_1.expect)((0, aontu_1.Aontu)('a:{b:1},a:{c:2}').canon).equal('{"a":{"b":1,"c":2}}');
        (0, code_1.expect)((0, aontu_1.Aontu)('a:b:1,a:c:2').canon).equal('{"a":{"b":1,"c":2}}');
        (0, code_1.expect)((0, aontu_1.Aontu)(`
a:{b:1}
a:{c:2}
`).canon).equal('{"a":{"b":1,"c":2}}');
        let p0 = new aontu_1.Lang();
        (0, code_1.expect)(p0.parse(`
u: { x: 1, y: number}
q: a: $.u
w: b: $.q.a & {y:2,z:3}
`).canon).equal('{"u":{"x":1,"y":number},"q":{"a":$.u},"w":{"b":$.q.a&{"y":2,"z":3}}}');
        (0, code_1.expect)((0, aontu_1.Aontu)(`
q: a: { x: 1 }
w0: b: $.q.a & {y:2,z:3}
w1: b: {y:2,z:3} & $.q.a
`).gen()).equal({
            q: { a: { x: 1 } },
            w0: { b: { x: 1, y: 2, z: 3 } },
            w1: { b: { x: 1, y: 2, z: 3 } },
        });
        // TODO: fix in jsonic
        (0, code_1.expect)((0, aontu_1.Aontu)('{a:b:1\na:c:2}').canon).equal('{"a":{"b":1,"c":2}}');
    });
    (0, node_test_1.it)('util', async () => {
        (0, code_1.expect)(aontu_1.util.options('x')).include({ src: 'x', print: 0 });
        (0, code_1.expect)(aontu_1.util.options('x', { print: 1 })).include({ src: 'x', print: 1 });
        (0, code_1.expect)(aontu_1.util.options({ src: 'x' }, { print: 1 })).include({
            src: 'x',
            print: 1,
        });
        (0, code_1.expect)(aontu_1.util.options({ src: 'x', print: 1 }, { src: 'y', print: 2 })).include({ src: 'y', print: 2 });
    });
    (0, node_test_1.it)('file', async () => {
        let v0 = (0, aontu_1.Aontu)('@"' + __dirname + '/../test/t02.jsonic"');
        (0, code_1.expect)(v0.canon).equal('{"sys":{"ent":{"name":string}},"ent":{"foo":{"name":"foo","fields":{"f0":{"kind":"string"}}},"bar":{"name":"bar","fields":{"f0":{"kind":"number"}}}}}');
        (0, code_1.expect)(v0.gen()).equal({
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
    (0, node_test_1.it)('pref', async () => {
        try {
            (0, aontu_1.Aontu)('@"' + __dirname + '/../test/t03.jsonic"', {
                base: __dirname,
            });
        }
        catch (err) {
            (0, code_1.expect)(err.message).include('Cannot unify value: integer|*1 with value: true');
        }
    });
    (0, node_test_1.it)('map-spread', () => {
        let v0 = (0, aontu_1.Aontu)('c:{&:{x:2},y:{k:3},z:{k:4}}');
        (0, code_1.expect)(v0.canon).equal('{"c":{&:{"x":2},"y":{"k":3,"x":2},"z":{"k":4,"x":2}}}');
        let v1 = (0, aontu_1.Aontu)('c:{&:{x:2},z:{k:4}},c:{y:{k:3}}');
        (0, code_1.expect)(v1.canon).equal('{"c":{&:{"x":2},"z":{"k":4,"x":2},"y":{"k":3,"x":2}}}');
        let v10 = (0, aontu_1.Aontu)('a:{&:{x:1}},b:.a,b:{y:{k:2}},c:{&:{x:2}},c:{y:{k:3}}');
        (0, code_1.expect)(v10.canon).equal('{"a":{&:{"x":1}},' +
            '"b":{&:{"x":1},"y":{"k":2,"x":1}},' +
            '"c":{&:{"x":2},"y":{"k":3,"x":2}}}');
    });
    (0, node_test_1.it)('empty-and-comments', () => {
        (0, code_1.expect)((0, aontu_1.Aontu)('').gen()).equal({});
        (0, code_1.expect)((0, aontu_1.Aontu)().gen()).equal({});
        (0, code_1.expect)((0, aontu_1.Aontu)(`
    # comment
    `).gen()).equal({});
    });
    (0, node_test_1.it)('spread-edges', () => {
        (0, code_1.expect)((0, aontu_1.Aontu)('a:b:{} a:&:{x:1}').gen()).equal({ a: { b: { x: 1 } } });
        // FIX
        // expect(Aontu('a:{} &:{x:1}').gen()).toEqual({ a: { x: 1 } })
    });
    (0, node_test_1.it)('key-edges', () => {
        (0, code_1.expect)((0, aontu_1.Aontu)('a:{k:.$KEY}').gen()).equal({ a: { k: 'a' } });
        (0, code_1.expect)((0, aontu_1.Aontu)('a:b:{k:.$KEY}').gen()).equal({ a: { b: { k: 'b' } } });
        (0, code_1.expect)((0, aontu_1.Aontu)('a:{k:.$KEY} x:1').gen()).equal({ x: 1, a: { k: 'a' } });
        (0, code_1.expect)((0, aontu_1.Aontu)('a:b:{k:.$KEY} x:1').gen()).equal({ x: 1, a: { b: { k: 'b' } } });
        (0, code_1.expect)((0, aontu_1.Aontu)('x:1 a:{k:.$KEY}').gen()).equal({ x: 1, a: { k: 'a' } });
        (0, code_1.expect)((0, aontu_1.Aontu)('x:1 a:b:{k:.$KEY}').gen()).equal({ x: 1, a: { b: { k: 'b' } } });
    });
    (0, node_test_1.it)('practical-path-spread', () => {
        let v0 = (0, aontu_1.Aontu)(`
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
    (0, node_test_1.it)('virtual-fs', () => {
        const mfs = (0, memfs_1.memfs)({
            'foo.jsonic': '{f:11}'
        });
        const fs = mfs.fs;
        let v0 = (0, aontu_1.Aontu)(`a:@"/foo.jsonic"`, { fs });
        (0, code_1.expect)(v0.canon).equal('{"a":{"f":11}}');
        let v1 = (0, aontu_1.Aontu)(`a:@"foo.jsonic"`, { fs, path: '/' });
        (0, code_1.expect)(v1.canon).equal('{"a":{"f":11}}');
    });
});
//# sourceMappingURL=aontu.test.js.map