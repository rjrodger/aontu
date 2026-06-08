/* Copyright (c) 2020-2025 Richard Rodger and other contributors, MIT License */

// Minimal expect() shim over node:assert, providing just the @hapi/code
// surface used by this project's tests.

import { strict as assert } from 'node:assert'


type Throwable = () => unknown


class NotChain {
  constructor(private actual: any) { }

  contain(part: string): void {
    assert.ok(
      'string' === typeof this.actual && !this.actual.includes(part),
      `expected ${JSON.stringify(this.actual)} to not contain ${JSON.stringify(part)}`,
    )
  }
}


class ToChain {
  readonly not: NotChain

  constructor(private actual: any) {
    this.not = new NotChain(actual)
  }

  contain(part: string): void {
    assert.ok(
      'string' === typeof this.actual && this.actual.includes(part),
      `expected ${JSON.stringify(this.actual)} to contain ${JSON.stringify(part)}`,
    )
  }
}


class Expectation {
  readonly to: ToChain

  constructor(private actual: any) {
    this.to = new ToChain(actual)
  }

  equal(expected: any): void {
    assert.deepStrictEqual(this.actual, expected)
  }

  // Partial match: for each key in expected, the actual must have a deep-equal value.
  // For strings, behaves like substring inclusion.
  include(expected: any): void {
    if ('string' === typeof this.actual && 'string' === typeof expected) {
      assert.ok(
        this.actual.includes(expected),
        `expected ${JSON.stringify(this.actual)} to include ${JSON.stringify(expected)}`,
      )
      return
    }

    if (null == this.actual || 'object' !== typeof this.actual) {
      assert.fail(`expected object, got ${this.actual}`)
    }

    for (const key of Object.keys(expected)) {
      assert.deepStrictEqual(
        (this.actual as any)[key],
        expected[key],
        `include mismatch at key "${key}"`,
      )
    }
  }

  greaterThan(expected: number): void {
    assert.ok(
      this.actual > expected,
      `expected ${this.actual} to be greater than ${expected}`,
    )
  }

  match(regex: RegExp): void {
    assert.match(String(this.actual), regex)
  }

  exist(): void {
    assert.ok(
      null != this.actual,
      `expected value to exist, got ${this.actual}`,
    )
  }

  throws(pattern?: RegExp): void {
    assert.ok('function' === typeof this.actual, 'expected a function')
    assert.throws(this.actual as Throwable, pattern as any)
  }

  throw(pattern?: RegExp): void {
    this.throws(pattern)
  }
}


export function expect(actual: any): Expectation {
  return new Expectation(actual)
}
