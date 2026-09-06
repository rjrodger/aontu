"use strict";
/* Copyright (c) 2026 Richard Rodger, MIT License */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// The extension table of the template surface. The two TRANSFORMS are
// pinned by test/spec/template.tsv, which both runners execute; this is
// the one piece of the surface a spec row cannot reach, because the
// mode is handed a marker rather than a file name. Twin of
// TestMarkerFor in go/template_test.go.
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const template_1 = require("../dist/template");
(0, node_test_1.describe)('template-marker', () => {
    (0, node_test_1.test)('marker-for-reads-the-extension', () => {
        const cases = [
            // The comment token of the language, plus a dash.
            ['gen.ts', '//-'],
            ['handlers/gen.go', '//-'],
            ['gen.rb', '#-'],
            ['gen.sql', '---'],
            // A language with no line comment marks with the block form.
            ['theme.css', '/*-'],
            // THE EXTENSION IS CASE-INSENSITIVE: a file from a case-folding
            // filesystem is the same generator.
            ['GEN.TS', '//-'],
            // NO EXTENSION AT ALL takes the default rather than no marker:
            // `Makefile` and `Dockerfile` are ordinary generators, and the
            // table is a convenience over a default rather than the thing
            // that decides a file is a template.
            ['Makefile', '//-'],
            ['gen', '//-'],
            // A DOT IN A DIRECTORY IS NOT AN EXTENSION, or `v1.2/gen` would
            // be read as a `2/gen` file.
            ['v1.2/gen', '//-'],
            ['win\\v1.2\\gen', '//-'],
            // An extension the table does not know: the caller passes its own
            // marker, and the default is what it gets meanwhile.
            ['gen.zz', '//-'],
        ];
        for (const [path, want] of cases) {
            node_assert_1.default.equal((0, template_1.markerFor)(path), want, path);
        }
    });
});
//# sourceMappingURL=template.test.js.map