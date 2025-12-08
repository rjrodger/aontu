"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Site = void 0;
class Site {
    constructor(val) {
        const site = (val?.site ?? val);
        this.row = site?.row ?? -1;
        this.col = site?.col ?? -1;
        this.url = site?.url ?? '';
    }
}
exports.Site = Site;
//# sourceMappingURL=site.js.map