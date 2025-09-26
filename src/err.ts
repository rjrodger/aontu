/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import { util } from 'jsonic'

import { Val, ErrContext } from './type'
import { Nil } from './val/Nil'


const { errmsg } = util


// TODO: move to utility?
function descErr<NILS extends Nil | Nil[]>(
  err: NILS | any,
  errctx?: ErrContext,
): any {
  if (err?.isNil) {
    if (null == err.msg || '' === err.msg) {
      let v1: any = err.primary
      let v2: any = err.secondary

      let v1src = resolveSrc(v1, errctx)
      let v2src = resolveSrc(v2, errctx)

      let valpath = (0 < err.path?.length ? err.path.join('.') : '')
      let attempt = null != err.attempt ? err.attempt : (null == v2 ? 'resolve' : 'unify')

      err.msg = [
        errmsg({
          color: true,
          name: 'aontu',
          code: err.why,
          msg: 'Cannot ' +
            attempt +
            ' path $.' + valpath + ' value' + (null == v2 ? '' : 's'),
        }),

        (null != v1 && errmsg({
          color: true,
          msg: 'Cannot ' + attempt + ' value: ' + v1.canon +
            (null == v2 ? '' : ' with value: ' + v2.canon),
          smsg: 'value was: ' + v1.canon,
          // file: v1.url?.replace(process.cwd() + '/', ''),
          file: resolveFile(v1.url),
          src: v1src,
          row: v1.row,
          col: v1.col,
        })),

        (null != v2 && errmsg({
          color: true,
          msg: 'Cannot ' + attempt + ' value: ' + v2.canon + ' with value: ' + v1.canon,
          smsg: 'value was: ' + v2.canon,
          // file: v2.url?.replace(process.cwd() + '/', ''),
          file: resolveFile(v2.url),
          src: v2src,
          row: v2.row,
          col: v2.col,
        })),


      ].filter(n => null != n && false !== n).join('\n')

    }
    return err
  }
  else {
    return err.map((n: any) => descErr(n, errctx))
  }
}

function resolveFile(url: string | undefined) {
  const cwd = process.cwd()
  let out = url?.replace(cwd + '/', '') ?? '<no-file>'
  out = out === cwd || '' === out ? '<no-file>' : out
  return out
}


function resolveSrc(v: Val, errctx?: ErrContext) {
  let src = null == v || null == v.url ? errctx?.src :
    errctx?.fs?.existsSync(v.url) ? errctx.fs.readFileSync(v.url, 'utf8') : errctx?.src
  return null == src ? '' : src
}


export {
  descErr
}
