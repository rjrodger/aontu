
const proc = {
  cwd: () => '/',
  env: {},
  platform: 'browser',
  argv: [],
  versions: {},
}

function bufferFrom(data, _encoding) {
  if ('string' === typeof data) return new TextEncoder().encode(data)
  if (data instanceof Uint8Array) return data
  return new TextEncoder().encode(String(data))
}

const buf = {
  from: bufferFrom,
  isBuffer: (b) => b instanceof Uint8Array,
}

export { proc as process, buf as Buffer }
