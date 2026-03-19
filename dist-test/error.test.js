"use strict";
/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
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
    (0, node_test_1.it)('error-source-inline', () => {
        // Inline source: error message should show the actual source text,
        // not SOURCE-NOT-FOUND.
        let a0 = new aontu_1.Aontu();
        let v0 = a0.unify('a:1,a:2', { collect: true });
        (0, code_1.expect)(v0.err[0].why).equal('scalar_value');
        (0, code_1.expect)(v0.err[0].msg).to.not.contain('SOURCE-NOT-FOUND');
        (0, code_1.expect)(v0.err[0].msg).to.contain('a:1,a:2');
    });
    (0, node_test_1.it)('error-source-inline-no-fs', () => {
        // Inline source without fs: should still show the source text
        // via errctx.src fallback.
        let a0 = new aontu_1.Aontu();
        let v0 = a0.unify('x:1,x:2', { collect: true });
        (0, code_1.expect)(v0.err[0].why).equal('scalar_value');
        (0, code_1.expect)(v0.err[0].msg).to.not.contain('SOURCE-NOT-FOUND');
        (0, code_1.expect)(v0.err[0].msg).to.not.contain('NO-FS');
        (0, code_1.expect)(v0.err[0].msg).to.contain('x:1,x:2');
    });
    (0, node_test_1.it)('error-source-inline-with-fs', () => {
        // Inline source with fs provided: fs cannot read a directory,
        // so should fall back to errctx.src.
        let a0 = new aontu_1.Aontu({ fs: node_fs_1.default, path: process.cwd() });
        let v0 = a0.unify('b:1,b:2', { collect: true });
        (0, code_1.expect)(v0.err[0].why).equal('scalar_value');
        (0, code_1.expect)(v0.err[0].msg).to.not.contain('SOURCE-NOT-FOUND');
        (0, code_1.expect)(v0.err[0].msg).to.contain('b:1,b:2');
    });
    (0, node_test_1.it)('error-source-file', () => {
        // File source: error message should show the file content.
        let a0 = new aontu_1.Aontu({ fs: node_fs_1.default });
        let v0 = a0.unify('@"' + __dirname + '/../test/error/e01.jsonic"', { collect: true });
        (0, code_1.expect)(v0.err[0].why).equal('scalar_value');
        (0, code_1.expect)(v0.err[0].msg).to.not.contain('SOURCE-NOT-FOUND');
        // e01.jsonic contains "a: 1\na: 2\n" — error should show the file content
        (0, code_1.expect)(v0.err[0].msg).to.contain('a: 1');
        (0, code_1.expect)(v0.err[0].msg).to.contain('a: 2');
    });
    (0, node_test_1.it)('error-source-file-cross', () => {
        // Cross-file error: e03.jsonic imports e04.jsonic, conflicting on key a.
        // Error message should show file content, not SOURCE-NOT-FOUND.
        let a0 = new aontu_1.Aontu({ fs: node_fs_1.default });
        let v0 = a0.unify('@"' + __dirname + '/../test/error/e03.jsonic"', { collect: true });
        (0, code_1.expect)(v0.err[0].why).equal('scalar_value');
        (0, code_1.expect)(v0.err[0].msg).to.not.contain('SOURCE-NOT-FOUND');
    });
    (0, node_test_1.it)('error-source-generate-inline', () => {
        // Generate with inline source: thrown error should contain source text.
        let a0 = new aontu_1.Aontu();
        try {
            a0.generate('a:1,a:2');
            throw new Error('should have thrown');
        }
        catch (e) {
            (0, code_1.expect)(e instanceof err_1.AontuError).equal(true);
            (0, code_1.expect)(e.message).to.not.contain('SOURCE-NOT-FOUND');
            (0, code_1.expect)(e.message).to.contain('a:1,a:2');
        }
    });
});
//# sourceMappingURL=error.test.js.map