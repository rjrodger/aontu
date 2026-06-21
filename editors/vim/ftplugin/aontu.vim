" Aontu filetype plugin.
if exists('b:did_ftplugin')
  finish
endif
let b:did_ftplugin = 1

setlocal commentstring=#\ %s
setlocal comments=:#
setlocal expandtab
setlocal shiftwidth=2
setlocal softtabstop=2
