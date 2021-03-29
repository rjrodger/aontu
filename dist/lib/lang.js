"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AontuLang = void 0;
const val_1 = require("./val");
let AontuLang = function aontu(jsonic) {
    jsonic.options({
        value: {
            src: {
                'string': () => new val_1.ScalarTypeVal(String),
                'number': () => new val_1.ScalarTypeVal(Number),
                'integer': () => new val_1.ScalarTypeVal(val_1.Integer),
                'boolean': () => new val_1.ScalarTypeVal(Boolean),
            }
        }
    });
    console.log('VAL', jsonic.options.value);
    jsonic.rule('val', (rs) => {
        let orig_bc = rs.def.bc;
        rs.def.bc = function (rule, ctx) {
            let out = orig_bc.call(this, rule, ctx);
            let valnode = rule.node;
            let valtype = typeof valnode;
            if ('string' === valtype) {
                valnode = new val_1.StringVal(rule.node);
            }
            else if ('number' === valtype) {
                if (Number.isInteger(rule.node)) {
                    valnode = new val_1.IntegerVal(rule.node);
                }
                else {
                    valnode = new val_1.NumberVal(rule.node);
                }
            }
            else if ('boolean' === valtype) {
                valnode = new val_1.BooleanVal(rule.node);
            }
            rule.node = valnode;
            return out;
        };
        return rs;
    });
};
exports.AontuLang = AontuLang;
//# sourceMappingURL=lang.js.map