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
        (0, expect_1.expect)(G('x: content("hello")')).equal({
            x: { cmp: 'Content', props: { src: 'hello' }, children: [] }
        });
        (0, expect_1.expect)(G('x: file("a.ts")')).equal({
            x: { cmp: 'File', props: { name: 'a.ts' }, children: [] }
        });
        (0, expect_1.expect)(G('x: folder("src")')).equal({
            x: { cmp: 'Folder', props: { name: 'src' }, children: [] }
        });
    });
    (0, node_test_1.test)('nested-tree', () => {
        (0, expect_1.expect)(G('x: folder("src", [file("a.ts", [content("let a = 1")])])'))
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
        (0, expect_1.expect)(G('x: file({name: "run.sh", mode: 493}, [content("#!/bin/sh")])'))
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
        Assert.equal(J('x: file("a.ts", [content("k")])'), '{"x":{"children":[{"children":[],"cmp":"Content","props":{"src":"k"}}],' +
            '"cmp":"File","props":{"name":"a.ts"}}}');
    });
    // THE CONTAINMENT GRAMMAR, checked at the call. Unification cannot
    // state it -- every node is a map and every map unifies with every
    // other -- so the constructor does, at the site the author wrote.
    (0, node_test_1.test)('containment-grammar', () => {
        // A Folder holds folders and files.
        (0, expect_1.expect)(G('x: folder("a", [folder("b"), file("c")])').x.children.length)
            .equal(2);
        Assert.equal(E('x: folder("a", [content("c")])'), 'invalid-arg');
        // A File holds content.
        (0, expect_1.expect)(G('x: file("a", [content("c")])').x.children.length).equal(1);
        Assert.equal(E('x: file("a", [file("b")])'), 'invalid-arg');
        // Content is a leaf.
        Assert.equal(E('x: content("a", [content("b")])'), 'invalid-arg');
        // A child that is not a node at all.
        Assert.equal(E('x: folder("a", [1])'), 'invalid-arg');
        Assert.equal(E('x: folder("a", [{cmp: "Nope"}])'), 'invalid-arg');
        // Children must BE a list: `form()` returns one, and a bare-node
        // convenience would make `file(n, form(...))` and
        // `file(n, [form(...)])` both legal and different.
        Assert.equal(E('x: folder("a", file("b"))'), 'invalid-arg');
    });
    (0, node_test_1.test)('spec-and-arity-refusals', () => {
        // The spec is a string or a props map, and nothing else.
        Assert.equal(E('x: file(1)'), 'invalid-arg');
        Assert.equal(E('x: file([1])'), 'invalid-arg');
        // The one prop the component cannot work without.
        Assert.equal(E('x: file({mode: 493})'), 'invalid-arg');
        Assert.equal(E('x: file({name: ""})'), 'invalid-arg');
        Assert.equal(E('x: file({name: 1})'), 'invalid-arg');
        Assert.equal(E('x: content({name: "a"})'), 'invalid-arg');
        // Arity. No signature declaration exists for the spike, so the
        // parse-time table cannot refuse these and the call does.
        Assert.equal(E('x: content()'), 'invalid-arg');
        Assert.equal(E('x: folder()'), 'invalid-arg');
        Assert.equal(E('x: content("a", "b")'), 'invalid-arg');
        Assert.equal(E('x: file("a", [], 1)'), 'invalid-arg');
    });
    // THE CHECK IS STRUCTURAL, not by class: a node reaches a children
    // list as a MAP -- through a reference, a `form()` instance, a
    // spread -- long after the call that made it has resolved away. So a
    // hand-written node is a node, and a map that is not one is refused
    // however it is spelled.
    (0, node_test_1.test)('nodes-are-recognised-structurally', () => {
        (0, expect_1.expect)(G('x: folder("a", [{cmp: "File", props: {name: "b"}, children: []}])')
            .x.children[0]).equal({ cmp: 'File', props: { name: 'b' }, children: [] });
        // Every way a map can fail to be a node: no `cmp` at all, a `cmp`
        // that is not a scalar, one that is not a string, and one that
        // names nothing.
        Assert.equal(E('x: folder("a", [{props: {}, children: []}])'), 'invalid-arg');
        Assert.equal(E('x: folder("a", [{cmp: {a: 1}}])'), 'invalid-arg');
        Assert.equal(E('x: folder("a", [{cmp: 1, props: {}, children: []}])'), 'invalid-arg');
        Assert.equal(E('x: folder("a", [{cmp: "Nope", props: {}, children: []}])'), 'invalid-arg');
    });
    // A call whose argument is not resolved yet residuates like any
    // other, and answers once the model settles -- there is no staging
    // rule here (CmpFuncVal.ts, "not staged, deliberately").
    (0, node_test_1.test)('forward-reference', () => {
        (0, expect_1.expect)(G('x: folder($.n, [file("a")])\nn: "src"').x.props)
            .equal({ name: 'src' });
        (0, expect_1.expect)(G('x: file($.n, [content("k")])\nn: "a.ts"').x.props)
            .equal({ name: 'a.ts' });
        // A CHAINED reference, which is what takes the extra pass: the
        // call is met against TOP with its argument still unresolved, so
        // it rebuilds itself and waits, which a one-hop reference to a
        // literal resolves too quickly to show.
        (0, expect_1.expect)(G('x: content($.n)\nn: $.m\nm: "k"').x.props).equal({ src: 'k' });
    });
    // THE NODE MAP IS CLOSED: the three keys are the vocabulary, so a
    // fourth is refused where every other mistake in an aontu document
    // is -- at evaluation, by unification.
    (0, node_test_1.test)('node-is-closed', () => {
        Assert.equal(E('x: folder("s") & {childrn: []}'), 'closed');
        // ... and the props map is not, because props are the component's
        // own business.
        (0, expect_1.expect)(G('x: file("a") & {props: {mode: 493}}').x.props)
            .equal({ name: 'a', mode: 493 });
    });
    // THE FINDING THIS SPIKE EXISTS FOR. A component tree is an ordinary
    // value, so the generation combinators reach it with no new
    // machinery: `form()` over model data returns a list, and a
    // children list is a list.
    (0, node_test_1.test)('form-generates-children', () => {
        (0, expect_1.expect)(G('names: [alpha, beta]\n' +
            'out: folder("src", form($.names, ' +
            'file(_ + ".ts", [content("export const " + _ + " = 1")])))').out.children).equal([
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
        (0, expect_1.expect)(G('a: file("x.ts", [content("k")])\nb: $.a.props.name'))
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
        Assert.equal(A.unify('x: content("k")').canon, '{"x":{"children":[],"cmp":"Content","props":{"src":"k"}}}');
    });
    // EIGHT MORE COMPONENTS, and the two names that were not free.
    // jostraca has ten; `copy` and `list` are aontu builtins already, so
    // those two are spelled `copyfile` and `repeat` here.
    (0, node_test_1.test)('the-whole-component-set', () => {
        const nodes = G('x: [project({}), folder("a"), file("b"), content("c"), ' +
            'line("d"), fragment("e"), slot("f"), inject("g"), copyfile("h"), ' +
            'repeat({item:[]})]').x;
        Assert.deepEqual(nodes.map((n) => n.cmp), [
            'Project', 'Folder', 'File', 'Content', 'Line',
            'Fragment', 'Slot', 'Inject', 'Copy', 'List',
        ]);
        // The FUNCTION is lower case, like every other builtin here; the
        // NODE names the jostraca component the bridge looks up. The two
        // spellings say which side of the seam they are on.
        (0, expect_1.expect)(G('x: file("a.ts")').x).equal({ cmp: 'File', props: { name: 'a.ts' }, children: [] });
    });
    // `project`'s folder is the one optional text prop, because jostraca
    // defaults it: the data path must not be stricter than the component
    // it drives.
    (0, node_test_1.test)('project-folder-is-optional', () => {
        (0, expect_1.expect)(G('x: project()').x).equal({ cmp: 'Project', props: {}, children: [] });
        (0, expect_1.expect)(G('x: project("out")').x.props).equal({ folder: 'out' });
        Assert.equal(E('x: project({folder: 1})'), 'invalid-arg');
        // Every other text prop is required.
        Assert.equal(E('x: folder()'), 'invalid-arg');
        Assert.equal(E('x: copyfile()'), 'invalid-arg');
    });
    // `repeat` is driven by a LIST, so it has no one-string spelling and
    // its `item` is checked: a repeat with no item renders nothing,
    // silently, which is the failure a data path must not have.
    (0, node_test_1.test)('repeat-is-driven-by-a-list', () => {
        (0, expect_1.expect)(G('x: repeat({item: [1,2]}, [line("a")])').x.props.item).equal([1, 2]);
        Assert.equal(E('x: repeat("nope")'), 'invalid-arg');
        Assert.equal(E('x: repeat({})'), 'invalid-arg');
        Assert.equal(E('x: repeat({item: "no"})'), 'invalid-arg');
    });
    // The containment grammar covers the new components too.
    (0, node_test_1.test)('containment-covers-the-whole-set', () => {
        (0, expect_1.expect)(G('x: file("a", [fragment("t", [slot("s", [line("x")])])])')
            .x.children[0].cmp).equal('Fragment');
        (0, expect_1.expect)(G('x: folder("a", [copyfile("L")])').x.children[0].cmp).equal('Copy');
        // A slot belongs to a fragment, not to a file.
        Assert.equal(E('x: file("a", [slot("s")])'), 'invalid-arg');
        // A folder does not hold content.
        Assert.equal(E('x: folder("a", [line("x")])'), 'invalid-arg');
        // copyfile is a leaf.
        Assert.equal(E('x: copyfile("a", [line("x")])'), 'invalid-arg');
    });
    // CHILDREN FLATTEN. A generator's output lands in the MIDDLE of a
    // written list, so that list holds nodes and LISTS of nodes; a list
    // is not a node and could only be an error otherwise, which is what
    // makes splicing the total rule (CmpFuncVal.ts, "children
    // flatten").
    (0, node_test_1.test)('children-flatten', () => {
        (0, expect_1.expect)(G('x: file("a", [content("1"), [content("2"), content("3")]])')
            .x.children.map((c) => c.props.src)).equal(['1', '2', '3']);
        // To any depth: a generator over a generator nests twice.
        (0, expect_1.expect)(G('x: file("a", [[[content("deep")]]])')
            .x.children.map((c) => c.props.src)).equal(['deep']);
        // The grammar still applies to what the flattening produces.
        Assert.equal(E('x: file("a", [[folder("b")]])'), 'invalid-arg');
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
        // That is what `nom` is for -- `upper("planet_body")` is
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