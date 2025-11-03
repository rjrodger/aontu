"use strict";
/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const code_1 = require("@hapi/code");
const aontu_1 = require("../dist/aontu");
const MapVal_1 = require("../dist/val/MapVal");
(0, node_test_1.describe)('error', function () {
    (0, node_test_1.it)('syntax', () => {
        let a0 = new aontu_1.AontuX();
        let v0 = a0.unify('a::1', { collect: true });
        (0, code_1.expect)(v0.err[0]).exist();
        // TODO: normalize Jsonic Errors into Aontu Errors
        // expect(v0.err[0]).include({ nil: true, why: 'syntax' })
        // expect(typeof v0.err[0].msg).equal('string')
    });
    (0, node_test_1.it)('unify', () => {
        let a0 = new aontu_1.AontuX();
        let v0 = a0.unify('a:1,a:2', { collect: true });
        (0, code_1.expect)(v0.err[0].why).equal('scalar');
        (0, code_1.expect)(typeof v0.err[0].msg).equal('string');
    });
    (0, node_test_1.it)('file-e01', async () => {
        let a0 = new aontu_1.AontuX();
        let v0 = a0.unify('@"' + __dirname + '/../test/error/e01.jsonic"', { collect: true });
        (0, code_1.expect)(v0.err[0].why).equal('scalar');
        (0, code_1.expect)(typeof v0.err[0].msg).equal('string');
    });
    (0, node_test_1.it)('generate', () => {
        let a0 = new aontu_1.AontuX();
        let v0 = a0.unify('a:$.b');
        try {
            v0.gen(makeCtx());
        }
        catch (err) {
            // expect(err.message).contain('Cannot')
        }
        let c0 = new aontu_1.Context({ root: v0 });
        let g0 = v0.gen(c0);
        // expect(g0).equal({ a: undefined })
        /*
        expect(c0.err[0] as any).include({
          path: ['a'],
          row: 1,
          col: 3,
          nil: true,
          why: 'ref',
        })
        expect(c0.err[0].primary as any).include({
          peg: ['b'],
          absolute: true
          })
          */
    });
    (0, node_test_1.it)('generate-file-e02', () => {
        let ctx = makeCtx();
        let a0 = new aontu_1.AontuX();
        let v0 = a0.unify('@"' + __dirname + '/../test/error/e02.jsonic"');
        try {
            v0.gen(ctx);
        }
        catch (err) {
            (0, code_1.expect)(err.message).contain('RefVal');
        }
        let v1 = a0.unify('@"' + __dirname + '/../test/error/e02.jsonic"');
        let c1 = new aontu_1.Context({ root: v1 });
        let g1 = v1.gen(c1);
        // expect(g1).equal({ a: undefined })
        (0, code_1.expect)(g1).includes({ isNil: true });
        /*
        expect(c1.err[0] as any).include({
          path: ['a'],
          row: 1,
          col: 4,
          nil: true,
          why: 'ref',
        })
        expect(c1.err[0].primary as any).include({
          peg: ['b'],
          absolute: true
          })
          */
    });
});
function makeCtx(r) {
    return new aontu_1.Context({ root: r || new MapVal_1.MapVal({ peg: {} }) });
}
//# sourceMappingURL=error.test.js.map