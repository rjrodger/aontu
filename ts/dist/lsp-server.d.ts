#!/usr/bin/env node
import { LspHandler } from './lsp';
declare class FrameCodec {
    private handler;
    private write;
    private onExit;
    private buffer;
    constructor(handler: LspHandler, write: (chunk: Buffer) => void, onExit: (code: number) => void);
    push(chunk: Buffer): void;
    end(): void;
    private drain;
    private send;
}
declare function main(stdin?: NodeJS.ReadableStream, write?: (chunk: Buffer) => void, exit?: (code: number) => void): FrameCodec;
export { FrameCodec, main, };
