"use strict";
/* Copyright (c) 2020-2025 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const ctx_1 = require("../dist/ctx");
const aontu_1 = require("../dist/aontu");
const expect_1 = require("./expect");
const MapVal_1 = require("../dist/val/MapVal");
const PrefVal_1 = require("../dist/val/PrefVal");
const NumberVal_1 = require("../dist/val/NumberVal");
const StringVal_1 = require("../dist/val/StringVal");
const BooleanVal_1 = require("../dist/val/BooleanVal");
const NullVal_1 = require("../dist/val/NullVal");
(0, node_test_1.describe)('val-pref', function () {
    (0, node_test_1.test)('construct', () => {
        let r0 = new PrefVal_1.PrefVal({ peg: new NumberVal_1.NumberVal({ peg: 1 }) });
        (0, expect_1.expect)(r0.canon).equal('*1.0');
        (0, expect_1.expect)(r0.rank).equal(0);
        let r1 = new PrefVal_1.PrefVal({ peg: new StringVal_1.StringVal({ peg: 'a' }) });
        (0, expect_1.expect)(r1.canon).equal('*"a"');
        (0, expect_1.expect)(r1.rank).equal(0);
        let r2 = new PrefVal_1.PrefVal({
            peg: new PrefVal_1.PrefVal({ peg: new BooleanVal_1.BooleanVal({ peg: false }) })
        });
        (0, expect_1.expect)(r2.canon).equal('**false');
        (0, expect_1.expect)(r2.rank).equal(1);
        let r3 = new PrefVal_1.PrefVal({
            peg: new PrefVal_1.PrefVal({
                peg: new PrefVal_1.PrefVal({ peg: new NullVal_1.NullVal({ peg: null }) })
            })
        });
        (0, expect_1.expect)(r3.canon).equal('***null');
        (0, expect_1.expect)(r3.rank).equal(2);
    });
    (0, node_test_1.test)('conjunct', () => {
        let a0 = new aontu_1.Aontu();
        let G = a0.generate.bind(a0);
        (0, expect_1.expect)(G('*1&2')).equal(2);
        (0, expect_1.expect)(G('(*1)&3')).equal(3);
        (0, expect_1.expect)(G('*1&(4)')).equal(4);
        (0, expect_1.expect)(G('(*1&5)')).equal(5);
        (0, expect_1.expect)(G('((*1)&6)')).equal(6);
        (0, expect_1.expect)(G('((*1)&(7))')).equal(7);
        (0, expect_1.expect)(G('(((*1)&(8)))')).equal(8);
        (0, expect_1.expect)(G('12&*1')).equal(12);
        (0, expect_1.expect)(G('13&(*1)')).equal(13);
        (0, expect_1.expect)(G('(14)&*1')).equal(14);
        (0, expect_1.expect)(G('(15&*1)')).equal(15);
        (0, expect_1.expect)(G('(16&(*1))')).equal(16);
        (0, expect_1.expect)(G('((17)&(*1))')).equal(17);
        (0, expect_1.expect)(G('(((18)&(*1)))')).equal(18);
        (0, expect_1.expect)(() => G('21 & *1 & *2')).throws(/Cannot unify/);
        (0, expect_1.expect)(() => G('*1 & 22 & *2')).throws(/Cannot unify/);
        (0, expect_1.expect)(() => G('*1 & *2 & 23')).throws(/Cannot unify/);
        (0, expect_1.expect)(() => G('24 & **1 & **2')).throws(/Cannot unify/);
        (0, expect_1.expect)(() => G('**1 & 25 & **2')).throws(/Cannot unify/);
        (0, expect_1.expect)(() => G('**1 & **2 & 26')).throws(/Cannot unify/);
        (0, expect_1.expect)(() => G('(21) & *1 & *2')).throws(/Cannot unify/);
        (0, expect_1.expect)(() => G('(21 & *1) & *2')).throws(/Cannot unify/);
        (0, expect_1.expect)(() => G('(21 & *1 & *2)')).throws(/Cannot unify/);
        (0, expect_1.expect)(() => G('21 & (*1 & *2)')).throws(/Cannot unify/);
        (0, expect_1.expect)(() => G('21 & *1 & (*2)')).throws(/Cannot unify/);
        (0, expect_1.expect)(() => G('((21) & *1 & *2)')).throws(/Cannot unify/);
        (0, expect_1.expect)(() => G('((21 & *1) & *2)')).throws(/Cannot unify/);
        (0, expect_1.expect)(() => G('((21 & *1 & *2))')).throws(/Cannot unify/);
        (0, expect_1.expect)(() => G('(21 & (*1 & *2))')).throws(/Cannot unify/);
        (0, expect_1.expect)(() => G('(21 & *1 & (*2))')).throws(/Cannot unify/);
        (0, expect_1.expect)(G('31 & *1 & **2')).equal(31);
        (0, expect_1.expect)(G('*1 & 32 & **2')).equal(32);
        (0, expect_1.expect)(G('*1 & **2 & 33')).equal(33);
        (0, expect_1.expect)(G('34&*1&**2&***3')).equal(34);
    });
    (0, node_test_1.test)('func', () => {
        let a0 = new aontu_1.Aontu();
        let G = a0.generate.bind(a0);
        // `lower` answers a FLOAT (`lower(1.1)` is `1.0`), so a float peer
        // overrides and an integer one conflicts: the numeric leaves are
        // disjoint kinds and the gate is the preferred value's own kind.
        (0, expect_1.expect)(G('*lower(1.1)&2.5')).equal(2.5);
        (0, expect_1.expect)(() => G('*lower(1.1)&2')).throws(/Cannot unify/);
        (0, expect_1.expect)(() => G('*lower(1.1)&a')).throws(/Cannot unify/);
    });
    (0, node_test_1.test)('numeric-leaf-override', () => {
        let a0 = new aontu_1.Aontu();
        let G = a0.generate.bind(a0);
        // A preference is a DEFAULT, and a concrete peer OF THE SAME KIND
        // overrides it. That is the whole point: plain `1 & 2` is a
        // conflict, and `*1 & 2` is 2.
        (0, expect_1.expect)(G('x:*1 & 2')).equal({ x: 2 });
        (0, expect_1.expect)(G('x:*1.5 & 2.5')).equal({ x: 2.5 });
        (0, expect_1.expect)(() => G('x:*1.0 & 2')).throws(/Cannot unify/);
        (0, expect_1.expect)(() => G('x:*1 & 2.0')).throws(/Cannot unify/);
        (0, expect_1.expect)(() => G('x:*1 & 2.5')).throws(/Cannot unify/);
        // A peer of another kind is still a conflict, not an override.
        (0, expect_1.expect)(() => G('x:*1 & a')).throws(/Cannot unify/);
        (0, expect_1.expect)(() => G('x:*1.5 & true')).throws(/Cannot unify/);
        (0, expect_1.expect)(() => G('x:*a & 1')).throws(/Cannot unify/);
        // A peer that only restates a kind the preferred value already
        // satisfies leaves the preference standing.
        (0, expect_1.expect)(G('x:*1 & integer')).equal({ x: 1 });
        (0, expect_1.expect)(G('x:*1 & number')).equal({ x: 1 });
        (0, expect_1.expect)(G('x:*1.5 & float')).equal({ x: 1.5 });
        (0, expect_1.expect)(G('x:*1.5 & number')).equal({ x: 1.5 });
        (0, expect_1.expect)(() => G('x:*1 & float')).throws(/Cannot unify/);
        (0, expect_1.expect)(() => G('x:*1.5 & integer')).throws(/Cannot unify/);
        (0, expect_1.expect)(G('x:*integer & 7')).equal({ x: 7 });
        (0, expect_1.expect)(() => G('x:*integer & a')).throws(/Cannot unify/);
        (0, expect_1.expect)(G('x:*float & 1')).equal({ x: 1 });
    });
});
function makeCtx(r, p) {
    return new ctx_1.AontuContext({
        root: r || new MapVal_1.MapVal({ peg: {} }),
        // path: p
    });
}
//# sourceMappingURL=val-pref.test.js.map