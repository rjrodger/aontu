#!/usr/bin/env node
/* Copyright (c) 2025 Richard Rodger, MIT License */

// Executable entry for the Aontu Language Server (stdio). See
// bin/aontu.js for why the wrapper exists.
require('../dist/lsp-server').main()
