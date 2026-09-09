"use strict";
/* Copyright (c) 2026 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CmpFuncVal = exports.CMP_FUNCS = exports.CMP_DEF = void 0;
const err_1 = require("../err");
const MapVal_1 = require("./MapVal");
const ListVal_1 = require("./ListVal");
const StringVal_1 = require("./StringVal");
const FuncBaseVal_1 = require("./FuncBaseVal");
// EIGHT OF JOSTRACA'S TEN COMPONENTS. `Copy` and `List` are missing and
// cannot be added under these rules: `copy` and `list` are already
// aontu builtins with settled, unrelated meanings -- `copy(v)` copies a
// VALUE and `list()` is the list container kind, both declared in
// test/spec/signature.tsv and implemented in both ports. Lower-casing
// jostraca's names onto them would either shadow landed language
// surface or make one name mean two things by arity, and neither is a
// trade a spike gets to make. See docs/design/JOSTRACA.0.md.
const CMP_DEF = {
    // The output root. Its `folder` is refused an absolute path or a
    // `..` segment on the jostraca side, where the tree is data.
    project: {
        cmp: 'Project', text: 'folder', req: false,
        children: ['project', 'folder', 'file', 'copyfiles'],
    },
    folder: {
        cmp: 'Folder', text: 'name', req: true,
        children: ['folder', 'file', 'copyfiles'],
    },
    file: {
        cmp: 'File', text: 'name', req: true,
        children: ['content', 'line', 'fragment', 'inject', 'listitems', 'copyfiles'],
    },
    // A span of text, exactly as written. `FileOp` joins a file's spans
    // with the empty string, so a `content` carries its own terminator.
    content: {
        cmp: 'Content', text: 'src', req: true,
        children: [],
    },
    // A span with a newline added, which is the whole difference.
    line: {
        cmp: 'Line', text: 'src', req: true,
        children: [],
    },
    // A file read from disk with its `<[SLOT]>` markers filled.
    fragment: {
        cmp: 'Fragment', text: 'from', req: true,
        children: ['slot', 'content', 'line', 'listitems'],
    },
    slot: {
        cmp: 'Slot', text: 'name', req: true,
        children: ['content', 'line', 'fragment', 'listitems'],
    },
    // A body written between markers in a file that already exists.
    inject: {
        cmp: 'Inject', text: 'name', req: true,
        children: ['content', 'line', 'listitems'],
    },
    // `Copy` under a name aontu has free: `copy` is taken by the builtin
    // that copies a VALUE, and a file copy is a different verb.
    copyfiles: {
        cmp: 'CopyFiles', text: 'from', req: true,
        children: [],
    },
    // `List` under a name that says what it does: it renders its children
    // ONCE PER ELEMENT of `item`, binding jostraca's `{item}` and
    // `{item.path}` macros, and adds a trailing blank line unless
    // `line: false`.
    //
    // IT IS THE ONE COMPONENT THE AONTU SIDE ALREADY SUBSUMES, and a
    // generator should reach for `each()` first. `each($.rows, content(...))`
    // repeats in the MODEL, so the repetition is finished before the tree
    // exists and every produced node is data a document can reference,
    // vet and diff. `listitems` defers it into jostraca's define phase behind
    // a string macro aontu cannot see into -- which is the layer this
    // spike exists to remove. It is here so the component set is
    // complete, not because it is the better spelling.
    listitems: {
        cmp: 'ListItems', req: true, bag: 'item',
        children: ['content', 'line', 'fragment'],
    },
};
exports.CMP_DEF = CMP_DEF;
// The component name a value carries, when the value is a node this
// vocabulary built. Read structurally rather than by class, because a
// node reaches a children list as a MAP -- through a reference, a
// `each()` instance, a spread -- long after the call that made it has
// resolved away.
const BY_CMP = {};
for (const fname of Object.keys(CMP_DEF)) {
    BY_CMP[CMP_DEF[fname].cmp] = fname;
}
function nodeCmp(v) {
    if (true !== v?.isMap) {
        return undefined;
    }
    const cmp = v.peg?.cmp;
    const name = (true === cmp?.isScalar && 'string' === typeof cmp.peg) ?
        cmp.peg : undefined;
    // The node carries the JOSTRACA name; the grammar is written in aontu
    // names, so read it back through the one table.
    return (undefined === name) ? undefined : BY_CMP[name];
}
// A prop's text, when the prop is a concrete string.
function propText(props, key) {
    const v = props?.peg?.[key];
    return (true === v?.isScalar && 'string' === typeof v.peg) ? v.peg : undefined;
}
class CmpFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(cmp, spec, ctx) {
        super(spec, ctx);
        this.isCmpFunc = true;
        this.cmp = cmp;
    }
    funcname() {
        return this.cmp;
    }
    resolve(ctx, args) {
        const def = CMP_DEF[this.cmp];
        const leaf = 0 === def.children.length;
        // ARITY, refused here (see the spike-scope note above): a leaf
        // takes its spec alone, a container takes a spec and an optional
        // children list.
        // A component whose text prop is OPTIONAL may be called with
        // nothing at all: `project()` is the defaulted root, as
        // `project({})` is on the other side. Everything else needs its
        // spec.
        if (args.length < (def.req ? 1 : 0) || args.length > (leaf ? 1 : 2)) {
            return (0, err_1.makeNilErr)(ctx, 'invalid-arg', this, undefined, 'arity');
        }
        // THE SPEC IS A STRING OR A PROPS MAP. The string spelling fills
        // the one prop the component cannot work without, so the common
        // case reads as the component does -- `file("main.ts", ...)` --
        // and the map spelling is there the moment a second prop is
        // wanted: `file({name: "run.sh", mode: 0o755}, ...)`.
        const spec = args[0];
        let props;
        if (undefined === spec) {
            props = new MapVal_1.MapVal({ peg: {} }, ctx);
        }
        else if (true === spec?.isScalar && 'string' === typeof spec.peg) {
            if (undefined === def.text) {
                return (0, err_1.makeNilErr)(ctx, 'invalid-arg', this, spec, 'spec');
            }
            props = new MapVal_1.MapVal({ peg: { [def.text]: spec } }, ctx);
        }
        else if (true === spec?.isMap) {
            props = spec;
        }
        else {
            return (0, err_1.makeNilErr)(ctx, 'invalid-arg', this, spec, 'spec');
        }
        // The one prop that is not the component's own business: without
        // it there is no file to write and no content to write into one.
        if (undefined !== def.text) {
            const text = propText(props, def.text);
            if (def.req && (undefined === text || '' === text)) {
                return (0, err_1.makeNilErr)(ctx, 'invalid-arg', this, props, def.text);
            }
            if (!def.req && undefined !== props.peg?.[def.text] &&
                undefined === text) {
                return (0, err_1.makeNilErr)(ctx, 'invalid-arg', this, props, def.text);
            }
        }
        // A bag prop is required and must be a list: `listitems` with no
        // `item` renders nothing, silently, which is the failure a data
        // path must not have.
        if (undefined !== def.bag) {
            const bag = props.peg?.[def.bag];
            if (true !== bag?.isList) {
                return (0, err_1.makeNilErr)(ctx, 'invalid-arg', this, props, def.bag);
            }
        }
        // THE CHILDREN, flattened, then the containment grammar. Absent
        // is empty -- an empty folder and a file with no content are both
        // things a model may legitimately say -- and every node that
        // survives the flattening must be one this component admits.
        const kids = args[1];
        let children;
        if (undefined === kids) {
            children = new ListVal_1.ListVal({ peg: [] }, ctx);
        }
        else if (true === kids?.isList) {
            const flat = [];
            const splice = (list) => {
                for (const kid of list) {
                    if (true === kid?.isList) {
                        const bad = splice(kid.peg);
                        if (undefined !== bad) {
                            return bad;
                        }
                        continue;
                    }
                    const kcmp = nodeCmp(kid);
                    if (undefined === kcmp || !def.children.includes(kcmp)) {
                        return kid;
                    }
                    flat.push(kid);
                }
                return undefined;
            };
            const bad = splice(kids.peg);
            if (undefined !== bad) {
                return (0, err_1.makeNilErr)(ctx, 'invalid-arg', this, bad, 'children');
            }
            children = new ListVal_1.ListVal({ peg: flat }, ctx);
        }
        else {
            return (0, err_1.makeNilErr)(ctx, 'invalid-arg', this, kids, 'children');
        }
        const node = new MapVal_1.MapVal({
            peg: {
                cmp: new StringVal_1.StringVal({ peg: def.cmp }, ctx),
                props,
                children,
            }
        }, ctx);
        // Closed: the three keys ARE the node vocabulary (see the note
        // above). `props` is left open on purpose.
        node.closed = true;
        return this.place(node);
    }
} /* node:coverage ignore next 3 */
exports.CmpFuncVal = CmpFuncVal;
// ONE CLASS PER COMPONENT, generated from the table, because the
// registry constructs by `new funcval({peg: args})` and so needs a
// constructor per name. Written as a factory rather than eight
// near-identical subclasses: the table is the single statement of what
// exists, and a ninth component is a row in it and nothing else.
function cmpFuncClass(fname) {
    class Cmp extends CmpFuncVal {
        constructor(spec, ctx) {
            super(fname, spec, ctx);
        }
        make(_ctx, spec) {
            return new Cmp(spec);
        }
    }
    return Cmp;
}
const CMP_FUNCS = {};
exports.CMP_FUNCS = CMP_FUNCS;
for (const fname of Object.keys(CMP_DEF)) {
    CMP_FUNCS[fname] = cmpFuncClass(fname);
} /* node:coverage ignore next 7 */
//# sourceMappingURL=CmpFuncVal.js.map