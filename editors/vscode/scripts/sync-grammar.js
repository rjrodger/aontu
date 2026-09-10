/* Copyright (c) 2025 Richard Rodger, MIT License */


const Fs = require('node:fs')
const Path = require('node:path')

const SRC = Path.join(__dirname, '..', '..', '..', 'grammar', 'aontu.tmLanguage.json')
const DST = Path.join(__dirname, '..', 'syntaxes', 'aontu.tmLanguage.json')

Fs.mkdirSync(Path.dirname(DST), { recursive: true })
Fs.copyFileSync(SRC, DST)
