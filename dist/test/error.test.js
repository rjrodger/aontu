"use strict";
/* Copyright (c) 2020 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
let { Aontu, util } = require('..');
const lang_1 = require("../lib/lang");
const unify_1 = require("../lib/unify");
// let { makeFileResolver } = require('@jsonic/multisource')
describe('error', function () {
    it('file-e01', async () => {
        /*
        let v0 = Aontu('@"' + __dirname + '/error/e01.jsonic"', {
          resolver: makeFileResolver(),
        })
    
        console.log(v0)
        */
        let opts = {
            src: '@"' + __dirname + '/error/e01.jsonic"',
            // resolver: makeFileResolver(),
        };
        let lang = new lang_1.Lang(opts);
        let deps = {};
        let val = lang.parse(opts.src, { deps: deps });
        // console.log('INITIAL', val.canon)
        // console.dir(val, { depth: null })
        let uni = new unify_1.Unify(val);
        //let res = uni.res
        // console.log('UNIFIED', uni.res.canon)
        // console.dir(uni.res, { depth: null })
        // console.dir(uni.err, { depth: null })
    });
});
//# sourceMappingURL=error.test.js.map