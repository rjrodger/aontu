"use strict";
/* Copyright (c) 2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPath = void 0;
function formatPath(path, absolute) {
    let parts;
    if (Array.isArray(path)) {
        parts = path;
    }
    else {
        parts = path.path;
    }
    let pathstr = (0 < parts.length && false !== absolute ? '$.' : '') + parts.join('.');
    return pathstr;
}
exports.formatPath = formatPath;
//# sourceMappingURL=utility.js.map