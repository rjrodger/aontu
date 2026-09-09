"use strict";
/* Copyright (c) 2026 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentFuncVal = exports.FileFuncVal = exports.FolderFuncVal = exports.CmpFuncVal = exports.CMP_DEF = void 0;
const err_1 = require("../err");
const MapVal_1 = require("./MapVal");
const ListVal_1 = require("./ListVal");
const StringVal_1 = require("./StringVal");
const FuncBaseVal_1 = require("./FuncBaseVal");
const CMP_DEF = {
    Folder: { children: ['Folder', 'File'], text: 'name' },
    File: { children: ['Content'], text: 'name' },
    Content: { children: [], text: 'src' },
};
exports.CMP_DEF = CMP_DEF;
// The component name a value carries, when the value is a node this
// vocabulary built. Read structurally rather than by class, because a
// node reaches a children list as a MAP -- through a reference, a
// `form()` instance, a spread -- long after the call that made it has
// resolved away.
function nodeCmp(v) {
    if (true !== v?.isMap) {
        return undefined;
    }
    const cmp = v.peg?.cmp;
    const name = (true === cmp?.isScalar && 'string' === typeof cmp.peg) ?
        cmp.peg : undefined;
    return (undefined !== name && undefined !== CMP_DEF[name]) ? name : undefined;
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
        if (args.length < 1 || args.length > (leaf ? 1 : 2)) {
            return (0, err_1.makeNilErr)(ctx, 'invalid-arg', this, undefined, 'arity');
        }
        // THE SPEC IS A STRING OR A PROPS MAP. The string spelling fills
        // the one prop the component cannot work without, so the common
        // case reads as the component does -- `File("main.ts", ...)` --
        // and the map spelling is there the moment a second prop is
        // wanted: `File({name: "run.sh", mode: 0o755}, ...)`.
        const spec = args[0];
        let props;
        if (true === spec?.isScalar && 'string' === typeof spec.peg) {
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
        const text = propText(props, def.text);
        if (undefined === text || '' === text) {
            return (0, err_1.makeNilErr)(ctx, 'invalid-arg', this, props, def.text);
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
                cmp: new StringVal_1.StringVal({ peg: this.cmp }, ctx),
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
class FolderFuncVal extends CmpFuncVal {
    constructor(spec, ctx) {
        super('Folder', spec, ctx);
        this.isFolderFunc = true;
    }
    make(_ctx, spec) {
        return new FolderFuncVal(spec);
    }
} /* node:coverage ignore next 3 */
exports.FolderFuncVal = FolderFuncVal;
class FileFuncVal extends CmpFuncVal {
    constructor(spec, ctx) {
        super('File', spec, ctx);
        this.isFileFunc = true;
    }
    make(_ctx, spec) {
        return new FileFuncVal(spec);
    }
} /* node:coverage ignore next 3 */
exports.FileFuncVal = FileFuncVal;
class ContentFuncVal extends CmpFuncVal {
    constructor(spec, ctx) {
        super('Content', spec, ctx);
        this.isContentFunc = true;
    }
    make(_ctx, spec) {
        return new ContentFuncVal(spec);
    }
} /* node:coverage ignore next 9 */
exports.ContentFuncVal = ContentFuncVal;
//# sourceMappingURL=CmpFuncVal.js.map