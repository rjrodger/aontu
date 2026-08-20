declare class LineCodec {
    private write;
    private onExit;
    private version;
    private buffer;
    constructor(write: (line: string) => void, onExit: (code: number) => void, version: string);
    push(chunk: string | Buffer): void;
    end(): void;
    private line;
    private send;
}
declare function main(stdin?: NodeJS.ReadableStream, write?: (line: string) => void, exit?: (code: number) => void, version?: string): LineCodec;
export { LineCodec, main, };
