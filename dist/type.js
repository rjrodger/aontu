"use strict";
/* Copyright (c) 2022-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_OPTS = exports.SPREAD = exports.DONE = void 0;
const DEFAULT_OPTS = () => {
    return {
        print: -1,
        debug: false,
        trace: false,
    };
};
exports.DEFAULT_OPTS = DEFAULT_OPTS;
const DONE = -1;
exports.DONE = DONE;
const SPREAD = Symbol('spread');
exports.SPREAD = SPREAD;
//# sourceMappingURL=type.js.map