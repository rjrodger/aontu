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
// THE COMPONENT PRIMITIVES -- SPIKE (ts/src/val/CmpFuncVal.ts,
// docs/design/JOSTRACA.0.md). TypeScript only, so the cases live here
// rather than in test/spec/*.tsv: a shared row must pass in BOTH
// engines (AGENTS.md, "Adding a behaviour") and the Go port has no
// component primitives yet. When the spike lands for real these
// become spec rows, probed against both CLIs.
const node_test_1 = require("node:test");
const Assert = __importStar(require("node:assert"));
const Fs = __importStar(require("node:fs"));
const Path = __importStar(require("node:path"));
const expect_1 = require("./expect");
const __1 = require("..");
const A = new __1.Aontu();
const G = (src) => A.generate(src);
// The generated tree, as JSON text, for the cases where key order and
// exact bytes are the point (the bridge reads these bytes).
const J = (src) => JSON.stringify(G(src));
// The why-code of the first collected failure.
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
(0, node_test_1.describe)('cmp', () => {
    // THE NODE SHAPE. Three keys, always all three: `cmp` names the
    // jostraca component, `props` is what reaches it as its first
    // argument, `children` is its second. A leaf carries an empty
    // children list rather than none, so the bridge has one rule.
    (0, node_test_1.test)('node-shape', () => {
        (0, expect_1.expect)(G('x: Content("hello")')).equal({
            x: { cmp: 'Content', props: { src: 'hello' }, children: [] }
        });
        (0, expect_1.expect)(G('x: File("a.ts")')).equal({
            x: { cmp: 'File', props: { name: 'a.ts' }, children: [] }
        });
        (0, expect_1.expect)(G('x: Folder("src")')).equal({
            x: { cmp: 'Folder', props: { name: 'src' }, children: [] }
        });
    });
    (0, node_test_1.test)('nested-tree', () => {
        (0, expect_1.expect)(G('x: Folder("src", [File("a.ts", [Content("let a = 1")])])'))
            .equal({
            x: {
                cmp: 'Folder',
                props: { name: 'src' },
                children: [{
                        cmp: 'File',
                        props: { name: 'a.ts' },
                        children: [{
                                cmp: 'Content',
                                props: { src: 'let a = 1' },
                                children: [],
                            }],
                    }],
            }
        });
    });
    // A map spec carries whatever props the component reads: jostraca's
    // File already takes `mode` and `exclude`, and the primitives do not
    // gate the set (see CmpFuncVal.ts, "the node map is closed and its
    // props map is not").
    (0, node_test_1.test)('props-map-spec', () => {
        (0, expect_1.expect)(G('x: File({name: "run.sh", mode: 493}, [Content("#!/bin/sh")])'))
            .equal({
            x: {
                cmp: 'File',
                props: { name: 'run.sh', mode: 493 },
                children: [{ cmp: 'Content', props: { src: '#!/bin/sh' }, children: [] }],
            }
        });
    });
    // THE BYTES THE BRIDGE READS. Map keys generate in code-point order,
    // so a node is always {children, cmp, props} on the wire whatever
    // order the call was written in.
    (0, node_test_1.test)('generated-json-is-key-ordered', () => {
        Assert.equal(J('x: File("a.ts", [Content("k")])'), '{"x":{"children":[{"children":[],"cmp":"Content","props":{"src":"k"}}],' +
            '"cmp":"File","props":{"name":"a.ts"}}}');
    });
    // THE CONTAINMENT GRAMMAR, checked at the call. Unification cannot
    // state it -- every node is a map and every map unifies with every
    // other -- so the constructor does, at the site the author wrote.
    (0, node_test_1.test)('containment-grammar', () => {
        // A Folder holds folders and files.
        (0, expect_1.expect)(G('x: Folder("a", [Folder("b"), File("c")])').x.children.length)
            .equal(2);
        Assert.equal(E('x: Folder("a", [Content("c")])'), 'invalid-arg');
        // A File holds content.
        (0, expect_1.expect)(G('x: File("a", [Content("c")])').x.children.length).equal(1);
        Assert.equal(E('x: File("a", [File("b")])'), 'invalid-arg');
        // Content is a leaf.
        Assert.equal(E('x: Content("a", [Content("b")])'), 'invalid-arg');
        // A child that is not a node at all.
        Assert.equal(E('x: Folder("a", [1])'), 'invalid-arg');
        Assert.equal(E('x: Folder("a", [{cmp: "Nope"}])'), 'invalid-arg');
        // Children must BE a list: `form()` returns one, and a bare-node
        // convenience would make `File(n, form(...))` and
        // `File(n, [form(...)])` both legal and different.
        Assert.equal(E('x: Folder("a", File("b"))'), 'invalid-arg');
    });
    (0, node_test_1.test)('spec-and-arity-refusals', () => {
        // The spec is a string or a props map, and nothing else.
        Assert.equal(E('x: File(1)'), 'invalid-arg');
        Assert.equal(E('x: File([1])'), 'invalid-arg');
        // The one prop the component cannot work without.
        Assert.equal(E('x: File({mode: 493})'), 'invalid-arg');
        Assert.equal(E('x: File({name: ""})'), 'invalid-arg');
        Assert.equal(E('x: File({name: 1})'), 'invalid-arg');
        Assert.equal(E('x: Content({name: "a"})'), 'invalid-arg');
        // Arity. No signature declaration exists for the spike, so the
        // parse-time table cannot refuse these and the call does.
        Assert.equal(E('x: Content()'), 'invalid-arg');
        Assert.equal(E('x: Folder()'), 'invalid-arg');
        Assert.equal(E('x: Content("a", "b")'), 'invalid-arg');
        Assert.equal(E('x: File("a", [], 1)'), 'invalid-arg');
    });
    // THE CHECK IS STRUCTURAL, not by class: a node reaches a children
    // list as a MAP -- through a reference, a `form()` instance, a
    // spread -- long after the call that made it has resolved away. So a
    // hand-written node is a node, and a map that is not one is refused
    // however it is spelled.
    (0, node_test_1.test)('nodes-are-recognised-structurally', () => {
        (0, expect_1.expect)(G('x: Folder("a", [{cmp: "File", props: {name: "b"}, children: []}])')
            .x.children[0]).equal({ cmp: 'File', props: { name: 'b' }, children: [] });
        // Every way a map can fail to be a node: no `cmp` at all, a `cmp`
        // that is not a scalar, one that is not a string, and one that
        // names nothing.
        Assert.equal(E('x: Folder("a", [{props: {}, children: []}])'), 'invalid-arg');
        Assert.equal(E('x: Folder("a", [{cmp: {a: 1}}])'), 'invalid-arg');
        Assert.equal(E('x: Folder("a", [{cmp: 1, props: {}, children: []}])'), 'invalid-arg');
        Assert.equal(E('x: Folder("a", [{cmp: "Nope", props: {}, children: []}])'), 'invalid-arg');
    });
    // A call whose argument is not resolved yet residuates like any
    // other, and answers once the model settles -- there is no staging
    // rule here (CmpFuncVal.ts, "not staged, deliberately").
    (0, node_test_1.test)('forward-reference', () => {
        (0, expect_1.expect)(G('x: Folder($.n, [File("a")])\nn: "src"').x.props)
            .equal({ name: 'src' });
        (0, expect_1.expect)(G('x: File($.n, [Content("k")])\nn: "a.ts"').x.props)
            .equal({ name: 'a.ts' });
        // A CHAINED reference, which is what takes the extra pass: the
        // call is met against TOP with its argument still unresolved, so
        // it rebuilds itself and waits, which a one-hop reference to a
        // literal resolves too quickly to show.
        (0, expect_1.expect)(G('x: Content($.n)\nn: $.m\nm: "k"').x.props).equal({ src: 'k' });
    });
    // THE NODE MAP IS CLOSED: the three keys are the vocabulary, so a
    // fourth is refused where every other mistake in an aontu document
    // is -- at evaluation, by unification.
    (0, node_test_1.test)('node-is-closed', () => {
        Assert.equal(E('x: Folder("s") & {childrn: []}'), 'closed');
        // ... and the props map is not, because props are the component's
        // own business.
        (0, expect_1.expect)(G('x: File("a") & {props: {mode: 493}}').x.props)
            .equal({ name: 'a', mode: 493 });
    });
    // THE FINDING THIS SPIKE EXISTS FOR. A component tree is an ordinary
    // value, so the generation combinators reach it with no new
    // machinery: `form()` over model data returns a list, and a
    // children list is a list.
    (0, node_test_1.test)('form-generates-children', () => {
        (0, expect_1.expect)(G('names: [alpha, beta]\n' +
            'out: Folder("src", form($.names, ' +
            'File(_ + ".ts", [Content("export const " + _ + " = 1")])))').out.children).equal([
            {
                cmp: 'File',
                props: { name: 'alpha.ts' },
                children: [
                    { cmp: 'Content', props: { src: 'export const alpha = 1' }, children: [] }
                ],
            },
            {
                cmp: 'File',
                props: { name: 'beta.ts' },
                children: [
                    { cmp: 'Content', props: { src: 'export const beta = 1' }, children: [] }
                ],
            },
        ]);
    });
    // A tree is addressable like any other value, which is what makes a
    // generated tree reviewable in the same document that builds it.
    (0, node_test_1.test)('tree-is-referenceable', () => {
        (0, expect_1.expect)(G('a: File("x.ts", [Content("k")])\nb: $.a.props.name'))
            .equal({
            a: {
                cmp: 'File',
                props: { name: 'x.ts' },
                children: [{ cmp: 'Content', props: { src: 'k' }, children: [] }],
            },
            b: 'x.ts',
        });
    });
    // Canon is the resolved node, as it is for every function that
    // answers from its arguments alone (`upper("a")` canons as `"A"`).
    (0, node_test_1.test)('canon-is-the-resolved-node', () => {
        Assert.equal(A.unify('x: Content("k")').canon, '{"x":{"children":[],"cmp":"Content","props":{"src":"k"}}}');
    });
    // CHILDREN FLATTEN. A generator's output lands in the MIDDLE of a
    // written list, so that list holds nodes and LISTS of nodes; a list
    // is not a node and could only be an error otherwise, which is what
    // makes splicing the total rule (CmpFuncVal.ts, "children
    // flatten").
    (0, node_test_1.test)('children-flatten', () => {
        (0, expect_1.expect)(G('x: File("a", [Content("1"), [Content("2"), Content("3")]])')
            .x.children.map((c) => c.props.src)).equal(['1', '2', '3']);
        // To any depth: a generator over a generator nests twice.
        (0, expect_1.expect)(G('x: File("a", [[[Content("deep")]]])')
            .x.children.map((c) => c.props.src)).equal(['deep']);
        // The grammar still applies to what the flattening produces.
        Assert.equal(E('x: File("a", [[Folder("b")]])'), 'invalid-arg');
    });
    // A file whose name and body come from the model, built the way a
    // real generator builds one: nothing here is component machinery --
    // it is `+`, a reference and `form()`.
    //
    // THE SOURCE IS THE FIXTURE, not a copy of it: cmp-spike.aon is the
    // file docs/design/JOSTRACA.0.md quotes and the pipeline command
    // runs, so asserting it here is what stops the note, the fixture and
    // the engine drifting apart.
    (0, node_test_1.test)('worked-example', () => {
        const src = Fs.readFileSync(Path.join(__dirname, '..', 'test', 'cmp-spike.aon'), 'utf8');
        const out = G(src).out;
        (0, expect_1.expect)(out.props).equal({ name: 'src' });
        (0, expect_1.expect)(out.children.length).equal(1);
        const file = out.children[0];
        (0, expect_1.expect)(file.cmp).equal('File');
        // EVERY NAME IS DERIVED from the one model name, `planet_body`:
        // the file in kebab, the interface in pascal, the fields in camel.
        // That is what `namer` is for -- `upper("planet_body")` is
        // `PLANET_BODY`, which is the gap this fixture used to paper over
        // by writing `Planet` out by hand.
        (0, expect_1.expect)(file.props).equal({ name: 'planet-body.ts' });
        // The file's body, in the order the model gave it: the header, one
        // line per field, the close. Each span carries its own newline:
        // jostraca's FileOp joins a file's content with the empty string,
        // and the spike has no `Line` primitive -- one of the gaps the
        // design note records.
        (0, expect_1.expect)(file.children.map((c) => c.props.src)).equal([
            'export interface PlanetBody {\n',
            '  id: number\n',
            '  surfaceGravity: number\n',
            '  meanRadius: number\n',
            '}\n',
        ]);
        Assert.equal(G('x: upper("planet_body")').x, 'PLANET_BODY');
    });
});
//# sourceMappingURL=cmp.test.js.map