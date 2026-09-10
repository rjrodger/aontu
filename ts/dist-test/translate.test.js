"use strict";
/* Copyright (c) 2026 Richard Rodger, MIT License */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const Assert = __importStar(require("node:assert"));
const __1 = require("..");
const caserange_1 = require("../dist/val/caserange");
const A = new __1.Aontu();
const G = (src) => A.generate(src);
const E = (src) => {
    try {
        A.generate(src);
    }
    catch (err) {
        const errs = 'function' === typeof err?.errs ? err.errs() : [];
        return errs[0]?.why;
    }
    return undefined;
};
(0, node_test_1.describe)('translate', () => {
    (0, node_test_1.test)('maps-each-character', () => {
        Assert.equal(G('a: translate("hello world", "lo", "01")').a, 'he001 w1r0d');
    });
    (0, node_test_1.test)('swaps', () => {
        Assert.equal(G('a: translate("abab", "ab", "ba")').a, 'baba');
        Assert.equal(G('a: rep(rep("abab", "a", "b"), "b", "a")').a, 'aaaa');
    });
    (0, node_test_1.test)('deletes', () => {
        Assert.equal(G('a: translate("hello", "l")').a, 'heo');
        Assert.equal(G('a: translate("hello", "l", "")').a, 'heo');
        Assert.equal(G('a: translate("a1b2c3", "0-9")').a, 'abc');
    });
    (0, node_test_1.test)('a-short-to-pads-with-its-last', () => {
        Assert.equal(G('a: translate("abc", "abc", "x")').a, 'xxx');
        Assert.equal(G('a: translate("abcd", "abcd", "xy")').a, 'xyyy');
    });
    (0, node_test_1.test)('ranges', () => {
        Assert.equal(G('a: translate("Hello", "a-z", "A-Z")').a, 'HELLO');
        Assert.equal(G('a: translate("secret", "a-y", "b-z")').a, 'tfdsfu');
        Assert.equal(G('a: translate("2026-09-09", "0-9", "x")').a, 'xxxx-xx-xx');
        Assert.equal(G('a: translate("a-b", "-", "_")').a, 'a_b');
        Assert.equal(G('a: translate("a-b", "-x", "_y")').a, 'a_b');
        Assert.equal(G('a: translate("axb", "x-", "y_")').a, 'ayb');
    });
    (0, node_test_1.test)('a-repeated-source-takes-its-last-mapping', () => {
        Assert.equal(G('a: translate("aaa", "aa", "xy")').a, 'yyy');
    });
    (0, node_test_1.test)('astral-characters-are-one-entry', () => {
        Assert.equal(G('a: translate("a😀b", "😀", "!")').a, 'a!b');
        Assert.equal(G('a: translate("a😀b", "😀")').a, 'ab');
    });
    (0, node_test_1.test)('refusals', () => {
        Assert.equal(E('x: translate("abc", "z-a", "x")'), 'invalid-arg');
        Assert.equal(E('x: translate("abc", "a", "z-a")'), 'invalid-arg');
        // Arity: two or three, never one or four.
        Assert.equal(E('x: translate("abc")'), 'invalid-arg');
        Assert.equal(E('x: translate("abc", "a", "b", "c")'), 'invalid-arg');
        // Every argument is text.
        Assert.equal(E('x: translate(1, "a", "b")'), 'invalid-arg');
        Assert.equal(E('x: translate("abc", 1, "b")'), 'invalid-arg');
        Assert.equal(E('x: translate("abc", "a", 1)'), 'invalid-arg');
    });
    (0, node_test_1.test)('forward-reference', () => {
        Assert.equal(G('x: translate($.n, "l", "L")\nn: $.m\nm: "hello"').x, 'heLLo');
    });
    (0, node_test_1.test)('an-unmatched-source-is-returned-whole', () => {
        Assert.equal(G('a: translate("abc", "xyz", "123")').a, 'abc');
        Assert.equal(G('a: translate("", "a", "b")').a, '');
    });
});
(0, node_test_1.describe)('caserange', () => {
    (0, node_test_1.test)('spans', () => {
        // start BEGINS the run when it is zero or positive ...
        Assert.deepEqual((0, caserange_1.caseSpan)(3, 0, 1), [0, 1]);
        Assert.deepEqual((0, caserange_1.caseSpan)(3, 1, -1), [1, 3]);
        // ... and STOPS it when it is negative: the character it lands on
        // is the first one not modified.
        Assert.deepEqual((0, caserange_1.caseSpan)(6, -3, -1), [0, 3]);
        Assert.deepEqual((0, caserange_1.caseSpan)(6, -1, -1), [0, 5]);
        Assert.deepEqual((0, caserange_1.caseSpan)(3, -1, 2), [0, 2]);
        // Both ends clamp, and a run wholly outside is empty rather than
        // inverted.
        Assert.deepEqual((0, caserange_1.caseSpan)(3, 10, 1), [3, 3]);
        Assert.deepEqual((0, caserange_1.caseSpan)(3, -10, 2), [0, 0]);
        Assert.deepEqual((0, caserange_1.caseSpan)(3, -3, 3), [0, 0]);
        Assert.deepEqual((0, caserange_1.caseSpan)(0, 0, 1), [0, 0]);
        Assert.deepEqual((0, caserange_1.caseSpan)(3, 0, 0), [0, 0]);
    });
    // A biginteger index is an index: it is a position in a string, so it
    // is small by construction or it clamps.
    (0, node_test_1.test)('a-biginteger-index-is-an-index', () => {
        Assert.equal(G('a: upper("foo", 0d1, 0d1)').a, 'fOo');
    });
});
//# sourceMappingURL=translate.test.js.map