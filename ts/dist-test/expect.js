"use strict";
/* Copyright (c) 2020-2025 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.expect = expect;
// Minimal expect() shim over node:assert, providing just the @hapi/code
// surface used by this project's tests.
const node_assert_1 = require("node:assert");
class NotChain {
    constructor(actual) {
        this.actual = actual;
    }
    contain(part) {
        node_assert_1.strict.ok('string' === typeof this.actual && !this.actual.includes(part), `expected ${JSON.stringify(this.actual)} to not contain ${JSON.stringify(part)}`);
    }
}
class ToChain {
    constructor(actual) {
        this.actual = actual;
        this.not = new NotChain(actual);
    }
    contain(part) {
        node_assert_1.strict.ok('string' === typeof this.actual && this.actual.includes(part), `expected ${JSON.stringify(this.actual)} to contain ${JSON.stringify(part)}`);
    }
}
class Expectation {
    constructor(actual) {
        this.actual = actual;
        this.to = new ToChain(actual);
    }
    equal(expected) {
        node_assert_1.strict.deepStrictEqual(this.actual, expected);
    }
    // Partial match: for each key in expected, the actual must have a deep-equal value.
    // For strings, behaves like substring inclusion.
    include(expected) {
        if ('string' === typeof this.actual && 'string' === typeof expected) {
            node_assert_1.strict.ok(this.actual.includes(expected), `expected ${JSON.stringify(this.actual)} to include ${JSON.stringify(expected)}`);
            return;
        }
        if (null == this.actual || 'object' !== typeof this.actual) {
            node_assert_1.strict.fail(`expected object, got ${this.actual}`);
        }
        for (const key of Object.keys(expected)) {
            node_assert_1.strict.deepStrictEqual(this.actual[key], expected[key], `include mismatch at key "${key}"`);
        }
    }
    greaterThan(expected) {
        node_assert_1.strict.ok(this.actual > expected, `expected ${this.actual} to be greater than ${expected}`);
    }
    match(regex) {
        node_assert_1.strict.match(String(this.actual), regex);
    }
    exist() {
        node_assert_1.strict.ok(null != this.actual, `expected value to exist, got ${this.actual}`);
    }
    throws(pattern) {
        node_assert_1.strict.ok('function' === typeof this.actual, 'expected a function');
        node_assert_1.strict.throws(this.actual, pattern);
    }
    throw(pattern) {
        this.throws(pattern);
    }
}
function expect(actual) {
    return new Expectation(actual);
}
//# sourceMappingURL=expect.js.map