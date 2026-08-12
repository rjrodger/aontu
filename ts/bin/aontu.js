#!/usr/bin/env node
/* Copyright (c) 2025 Richard Rodger, MIT License */

// Executable entry for the `aontu` CLI. The wrapper exists so the
// instrumented source (../dist/cli.js) carries no shebang and no
// require.main guard — lines no in-process coverage run can execute.
require('../dist/cli').main(process.argv)
