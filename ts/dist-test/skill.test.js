"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// THE SKILL SOURCES, HELD TO THE ENGINE (G7 phase 6). A skill whose
// examples do not evaluate teaches the wrong language, and it drifts
// the first time the surface moves. Every self-contained document in
// docs/skill/examples.md is evaluated here, so the ladder cannot rot
// unnoticed.
const node_test_1 = require("node:test");
const Assert = __importStar(require("node:assert"));
const Fs = __importStar(require("node:fs"));
const Path = __importStar(require("node:path"));
const aontu_1 = require("../dist/aontu");
const SKILL_DIR = Path.join(__dirname, '..', '..', 'docs', 'skill');
// Fenced blocks, with the two kinds that are not documents left out:
// a shell transcript, and a multi-file example whose `@"..."` include
// only resolves beside its sibling.
function documents(md) {
    const out = [];
    for (const block of md.split('```').filter((_, i) => 1 === i % 2)) {
        const body = block.replace(/^[a-z]*\n/, '');
        if (/^\s*aontu /m.test(body) || body.includes('@"')) {
            continue;
        }
        out.push(body);
    }
    return out;
}
(0, node_test_1.describe)('skill', () => {
    (0, node_test_1.test)('every-example-document-evaluates', () => {
        const md = Fs.readFileSync(Path.join(SKILL_DIR, 'examples.md'), 'utf8');
        const docs = documents(md);
        Assert.ok(4 < docs.length, `too few example documents: ${docs.length}`);
        for (const src of docs) {
            const aontu = new aontu_1.Aontu();
            const ctx = aontu.ctx({ collect: true });
            aontu.unify(src, undefined, ctx);
            Assert.deepEqual(ctx.err.map((e) => e.why), [], `example does not evaluate:\n${src}`);
        }
    });
    // The ladder's claims about what generates, checked rather than
    // asserted: rung 3 says the defaults appear, and rung 2 says
    // nothing does.
    (0, node_test_1.test)('the-ladder-generates-what-it-claims', () => {
        const truth = 'service: {\n  name: string\n  port: integer\n}';
        Assert.throws(() => new aontu_1.Aontu().generate(truth), /not concrete|Cannot|no_gen/i);
        const withDefaults = 'service: {\n  name: "auth"\n  port: *8080 | integer\n' +
            '  replicas: *1 | integer\n}';
        Assert.deepEqual(new aontu_1.Aontu().generate(withDefaults), { service: { name: 'auth', port: 8080, replicas: 1 } });
    });
    // The skill points at files; a pointer that does not resolve is
    // worse than no pointer.
    (0, node_test_1.test)('every-linked-file-exists', () => {
        for (const file of Fs.readdirSync(SKILL_DIR)) {
            const md = Fs.readFileSync(Path.join(SKILL_DIR, file), 'utf8');
            for (const m of md.matchAll(/\]\(([^)#][^)]*)\)/g)) {
                const target = Path.resolve(SKILL_DIR, m[1]);
                Assert.ok(Fs.existsSync(target), `${file}: broken link ${m[1]}`);
            }
        }
    });
});
//# sourceMappingURL=skill.test.js.map