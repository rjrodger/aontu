#!/usr/bin/env node
import { Aontu } from './aontu';
type Mode = 'json' | 'canon';
declare function evalSource(aontu: Aontu, src: string, mode: Mode): {
    ok: boolean;
    text: string;
};
declare function main(argv: string[]): void;
export { evalSource, main };
