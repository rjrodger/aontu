"use strict";
/* Copyright (c) 2021-2026 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandAliases = expandAliases;
const keyorder_1 = require("./keyorder");
const MapVal_1 = require("./val/MapVal");
function expandAliases(root, snapmap) {
    if (true !== root.isMap) {
        return;
    }
    const seen = new Set();
    const visit = (v, stack) => {
        if (null == v || true !== v.isVal || seen.has(v)) {
            return;
        }
        seen.add(v);
        if (true === v.isRef) {
            const name = v.aliasName;
            if (undefined === name) {
                return;
            }
            v.expansion = undefined;
            if (stack.includes(name)) {
                return;
            }
            const target = snapmap.get((0, MapVal_1.spreadSnapKey)(v)) ?? root.peg[name];
            if (null == target) {
                return;
            }
            v.expansion = target;
            visit(target, [...stack, name]);
            return;
        }
        if (true === v.isMap) {
            // A declaration is reached through its references, each under
            // its own name, never as a child: a self-reference inside it
            // is a knot only from inside.
            const keys = Object.keys(v.peg)
                .filter((k) => !v.aliasKeys.includes(k))
                .sort(keyorder_1.cmpCodePoint);
            for (const k of keys) {
                visit(v.peg[k], stack);
            }
        }
        else if (Array.isArray(v.peg)) {
            for (const e of v.peg) {
                visit(e, stack);
            }
        }
        else if (null != v.peg && true === v.peg.isVal) {
            visit(v.peg, stack);
        }
        if ((true === v.isMap || true === v.isList) && null != v.spread.cj) {
            visit(v.spread.cj, stack);
        }
    };
    visit(root, []);
} /* node:coverage ignore next 5 */
//# sourceMappingURL=alias.js.map