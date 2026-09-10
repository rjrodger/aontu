/* Copyright (c) 2025 Richard Rodger, MIT License */


import { LspHandler, Message, OutMessage } from './lsp'


class FrameCodec {
  private buffer = Buffer.alloc(0)

  constructor(
    private handler: LspHandler,
    private write: (chunk: Buffer) => void,
    private onExit: (code: number) => void,
  ) { }

  // Feed a chunk of incoming bytes; processes any complete frames.
  push(chunk: Buffer) {
    this.buffer = Buffer.concat([this.buffer, chunk])
    this.drain()
  }

  // Called when the input stream ends.
  end() {
    this.onExit(this.handler.exitCode)
  }

  private drain() {
    for (; ;) {
      const headerEnd = this.buffer.indexOf('\r\n\r\n')
      if (headerEnd < 0) return

      const header = this.buffer.subarray(0, headerEnd).toString('ascii')
      const match = /Content-Length:\s*(\d+)/i.exec(header)
      if (null == match) {
        // Malformed header block: skip past it and continue.
        this.buffer = this.buffer.subarray(headerEnd + 4)
        continue
      }

      const length = parseInt(match[1], 10)
      const bodyStart = headerEnd + 4
      if (this.buffer.length < bodyStart + length) return // need more bytes

      const body = this.buffer.subarray(bodyStart, bodyStart + length).toString('utf8')
      this.buffer = this.buffer.subarray(bodyStart + length)

      let msg: Message
      try {
        msg = JSON.parse(body)
      }
      catch {
        continue // ignore unparseable frame
      }

      for (const out of this.handler.handle(msg)) {
        this.send(out)
      }

      if (this.handler.shouldExit) {
        this.onExit(this.handler.exitCode)
        return
      }
    }
  }

  private send(out: OutMessage) {
    const body = Buffer.from(JSON.stringify(out), 'utf8')
    this.write(Buffer.from('Content-Length: ' + body.length + '\r\n\r\n', 'ascii'))
    this.write(body)
  }
}


function main(
  stdin: NodeJS.ReadableStream = process.stdin,
  write: (chunk: Buffer) => void = (chunk) => void process.stdout.write(chunk),
  exit: (code: number) => void = (code) => process.exit(code),
): FrameCodec {
  const handler = new LspHandler()
  const codec = new FrameCodec(handler, write, exit)

  stdin.on('data', (chunk: Buffer) => codec.push(chunk))
  stdin.on('end', () => codec.end())
  return codec
} /* node:coverage ignore next 11 */


// No require.main guard here: bin/aontu-lsp.js is the executable entry
// and calls main() itself, so this module stays import-only.


export {
  FrameCodec,
  main,
}
