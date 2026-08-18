import { Aontu } from './aontu';
type Mode = 'json' | 'canon';
declare function evalSource(aontu: Aontu, src: string, mode: Mode): {
    ok: boolean;
    text: string;
};
declare function watchChange(files: string[], pollMs: number): Promise<boolean>;
type VetWaiter = (files: string[]) => Promise<boolean>;
declare function runVet(argv: string[], wait?: VetWaiter): number | Promise<number>;
declare function main(argv: string[]): void;
export { evalSource, main, runVet, watchChange };
