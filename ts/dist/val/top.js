"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.top = top;
const TopVal_1 = require("./TopVal");
// A fresh instance per call: unify mutates Vals in place (paths, marks,
// site via addsite for a literal `top` in source), so a shared TOP
// singleton is silently corrupted by one parse and poisons every later
// parse in the same process (e.g. a hide() walk marking the shared TOP
// hid every subsequent unresolved top).
function top() {
    return new TopVal_1.TopVal({});
}
//# sourceMappingURL=top.js.map