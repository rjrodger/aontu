"use strict";
/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const code_1 = require("@hapi/code");
const aontu_1 = require("../dist/aontu");
(0, node_test_1.describe)('error', function () {
    (0, node_test_1.it)('syntax', () => {
        let v0 = (0, aontu_1.Aontu)('a::1');
        (0, code_1.expect)(v0.err[0]).include({ nil: true, why: 'syntax' });
        (0, code_1.expect)(typeof v0.err[0].msg).equal('string');
    });
    (0, node_test_1.it)('unify', () => {
        let v0 = (0, aontu_1.Aontu)('a:1,a:2');
        (0, code_1.expect)(v0.err[0]).include({ nil: true, why: 'scalar' });
        (0, code_1.expect)(typeof v0.err[0].msg).equal('string');
    });
    (0, node_test_1.it)('file-e01', async () => {
        let v0 = (0, aontu_1.Aontu)('@"' + __dirname + '/../test/error/e01.jsonic"');
        (0, code_1.expect)(v0.err[0]).include({ nil: true, why: 'scalar' });
        (0, code_1.expect)(typeof v0.err[0].msg).equal('string');
    });
    (0, node_test_1.it)('generate', () => {
        let v0 = (0, aontu_1.Aontu)('a:$.b');
        try {
            v0.gen();
        }
        catch (err) {
            (0, code_1.expect)(err.message).contain('Cannot resolve value: $.b');
        }
        let c0 = new aontu_1.Context({ root: v0 });
        let g0 = v0.gen(c0);
        (0, code_1.expect)(g0).equal({ a: undefined });
        (0, code_1.expect)(c0.err[0]).include({
            path: ['a'],
            row: 1,
            col: 3,
            nil: true,
            why: 'ref',
        });
        (0, code_1.expect)(c0.err[0].primary).include({
            peg: ['b'],
            absolute: true
        });
    });
    (0, node_test_1.it)('generate-file-e02', () => {
        let v0 = (0, aontu_1.Aontu)('@"' + __dirname + '/../test/error/e02.jsonic"');
        try {
            v0.gen();
        }
        catch (err) {
            (0, code_1.expect)(err.message).contain('Cannot resolve value: $.b');
        }
        let c0 = new aontu_1.Context({ root: v0 });
        let g0 = v0.gen(c0);
        (0, code_1.expect)(g0).equal({ a: undefined });
        (0, code_1.expect)(c0.err[0]).include({
            path: ['a'],
            row: 1,
            col: 4,
            nil: true,
            why: 'ref',
        });
        (0, code_1.expect)(c0.err[0].primary).include({
            peg: ['b'],
            absolute: true
        });
    });
});
//# sourceMappingURL=error.test.js.map