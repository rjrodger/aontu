"use strict";
/* Copyright (c) 2022-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_OPTS = exports.SPREAD = exports.DONE = void 0;
const Val_1 = require("./val/Val");
Object.defineProperty(exports, "DONE", { enumerable: true, get: function () { return Val_1.DONE; } });
Object.defineProperty(exports, "SPREAD", { enumerable: true, get: function () { return Val_1.SPREAD; } });
const DEFAULT_OPTS = () => {
    return {
        print: -1,
        debug: false,
        trace: false,
    };
};
exports.DEFAULT_OPTS = DEFAULT_OPTS;
//# sourceMappingURL=type.js.map