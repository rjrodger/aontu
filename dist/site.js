"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Site = void 0;
class Site {
    constructor(val) {
        this.row = -1;
        this.col = -1;
        this.url = '';
        if (val) {
            if ('site' in val) {
                // Val with site property
                this.row = val.site?.row ?? -1;
                this.col = val.site?.col ?? -1;
                this.url = val.site?.url ?? '';
            }
            else {
                // Plain object with row, col, url
                this.row = val.row ?? -1;
                this.col = val.col ?? -1;
                this.url = val.url ?? '';
            }
        }
    }
}
exports.Site = Site;
//# sourceMappingURL=site.js.map