/* Copyright (c) 2025 Richard Rodger, MIT License */

// Fixture: an included source whose export is a FUNCTION — the one raw
// JavaScript value rawToVal has no Val for, so it becomes a parse_unknown
// nil. Used by ts/test/coverage3.test.ts.
module.exports = function fn() { }
