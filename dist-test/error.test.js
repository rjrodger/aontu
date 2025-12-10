"use strict";
/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const code_1 = require("@hapi/code");
const aontu_1 = require("../dist/aontu");
const err_1 = require("../dist/err");
(0, node_test_1.describe)('error', function () {
    (0, node_test_1.it)('syntax', () => {
        let a0 = new aontu_1.Aontu();
        let v0 = a0.parse('a::1', { collect: true });
        (0, code_1.expect)(v0?.err[0].why).equal('syntax');
        let v1 = a0.unify('a::1', { collect: true });
        (0, code_1.expect)(v1?.err[0].why).equal('syntax');
        let err = [];
        let v2 = a0.generate('a::1', { err });
        (0, code_1.expect)(v2).equal(undefined);
        (0, code_1.expect)(err[0].why).equal('syntax');
        (0, code_1.expect)(() => a0.parse('a::1')).throws(/syntax/);
        (0, code_1.expect)(() => a0.unify('a::1')).throws(/syntax/);
        (0, code_1.expect)(() => a0.generate('a::1')).throws(/syntax/);
        try {
            a0.generate('a:"x');
        }
        catch (e) {
            (0, code_1.expect)(e.name).equal('AontuError');
            (0, code_1.expect)(e instanceof err_1.AontuError).equal(true);
        }
    });
    (0, node_test_1.it)('unify', () => {
        let a0 = new aontu_1.Aontu();
        let v0 = a0.unify('a:1,a:2', { collect: true });
        (0, code_1.expect)(v0.err[0].why).equal('scalar_value');
        (0, code_1.expect)(typeof v0.err[0].msg).equal('string');
    });
    (0, node_test_1.it)('file-e01', async () => {
        let a0 = new aontu_1.Aontu();
        let v0 = a0.unify('@"' + __dirname + '/../test/error/e01.jsonic"', { collect: true });
        (0, code_1.expect)(v0.err[0].why).equal('scalar_value');
        (0, code_1.expect)(typeof v0.err[0].msg).equal('string');
    });
    (0, node_test_1.it)('generate', () => {
        let aontu = new aontu_1.Aontu();
        (0, code_1.expect)(() => aontu.generate('a:$.b')).throw(/no_path/);
        (0, code_1.expect)(() => aontu.generate('@"' + __dirname + '/../test/error/e02.jsonic"'))
            .throw(/no_path/);
    });
    (0, node_test_1.it)('required', () => {
        let a0 = new aontu_1.Aontu();
        (0, code_1.expect)(a0.generate('a:string a:A')).equal({ a: 'A' });
        (0, code_1.expect)(() => a0.generate('a:string')).throws(/mapval_no_gen/);
        (0, code_1.expect)(() => a0.generate('a:string a:1')).throws(/no_scalar_unify/);
        (0, code_1.expect)(a0.generate('x:&:s:string x:a:s:S')).equal({ x: { a: { s: 'S' } } });
        (0, code_1.expect)(() => a0.generate('x:&:s:string x:a:s:1')).throws(/no_scalar_unify/);
        (0, code_1.expect)(() => a0.generate('x:&:s:string x:a:{}')).throws(/mapval_spread_required/);
        (0, code_1.expect)(a0.generate('x:[&:s:string] x:[{s:S}]')).equal({ x: [{ s: 'S' }] });
        (0, code_1.expect)(() => a0.generate('x:[&:s:string] x:[{s:1}]')).throws(/no_scalar_unify/);
        // NOT: map inside list!
        (0, code_1.expect)(() => a0.generate('x:[&:s:string] x:[{}]')).throws(/mapval_spread_required/);
        // TODO: better resolution of spresd children for error msgs
        (0, code_1.expect)(a0.generate('x:&:&:s:string x:a:b:s:S'))
            .equal({ x: { a: { b: { s: 'S' } } } });
        // expect(() => a0.generate('x:&:&:s:string x:a:b:{}'))
        //   .throws(/mapval_spread_required/)
    });
});
//# sourceMappingURL=error.test.js.map