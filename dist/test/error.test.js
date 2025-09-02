"use strict";
/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
const aontu_1 = require("../aontu");
describe('error', function () {
    it('syntax', () => {
        let v0 = (0, aontu_1.Aontu)('a::1');
        expect(v0.err[0]).toMatchObject({ nil: true, why: 'syntax' });
        expect(typeof v0.err[0].msg).toEqual('string');
    });
    it('unify', () => {
        let v0 = (0, aontu_1.Aontu)('a:1,a:2');
        expect(v0.err[0]).toMatchObject({ nil: true, why: 'scalar' });
        expect(typeof v0.err[0].msg).toEqual('string');
    });
    it('file-e01', async () => {
        let v0 = (0, aontu_1.Aontu)('@"' + __dirname + '/error/e01.jsonic"');
        expect(v0.err[0]).toMatchObject({ nil: true, why: 'scalar' });
        expect(typeof v0.err[0].msg).toEqual('string');
    });
    it('generate', () => {
        let v0 = (0, aontu_1.Aontu)('a:$.b');
        // v0.gen()
        expect(() => v0.gen()).toThrow('Cannot resolve path $.a');
        let c0 = new aontu_1.Context({ root: v0 });
        let g0 = v0.gen(c0);
        expect(g0).toEqual({ a: undefined });
        expect(c0.err[0]).toMatchObject({
            path: ['a'],
            row: 1,
            col: 3,
            nil: true,
            why: 'ref',
            primary: {
                peg: ['b'],
                absolute: true
            }
        });
    });
    it('generate-file-e02', () => {
        let v0 = (0, aontu_1.Aontu)('@"' + __dirname + '/error/e02.jsonic"');
        expect(() => v0.gen())
            .toThrow('Cannot resolve path $.a');
        let c0 = new aontu_1.Context({ root: v0 });
        let g0 = v0.gen(c0);
        expect(g0).toEqual({ a: undefined });
        expect(c0.err[0]).toMatchObject({
            path: ['a'],
            row: 1,
            col: 4,
            nil: true,
            why: 'ref',
            primary: {
                peg: ['b'],
                absolute: true
            }
        });
    });
});
//# sourceMappingURL=error.test.js.map