import { Aontu } from './aontu';
type Mode = 'json' | 'canon';
declare function evalSource(aontu: Aontu, src: string, mode: Mode): {
    ok: boolean;
    text: string;
};
declare function watchSignature(files: string[]): string;
declare function watchChange(files: string[], before: string, pollMs: number): Promise<boolean>;
type VetWaiter = (files: string[], before: string) => Promise<boolean>;
declare const vetWaiter: VetWaiter;
declare function runVet(argv: string[], wait?: VetWaiter): number | Promise<number>;
declare function main(argv: string[]): void;
export { evalSource, main, runVet, watchChange, watchSignature, vetWaiter };
