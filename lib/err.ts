/* Copyright (c) 2021-2023 Richard Rodger, MIT License */


import { Nil } from './val/Nil'


function descErr<NILS extends Nil | Nil[]>(err: NILS): any {
  if (err instanceof Nil) {
    let v1: any = err.primary || {}
    let v2: any = err.secondary || {}
    err.msg = 'Cannot unify' +
      (0 < err.path?.length ? ' path ' + err.path.join('.') : '') +
      ' ' + (err.url ? 'in ' + err.url : '') + ':\n' +

      'LHS: ' +
      (0 < v1.path?.length ? v1.path.join('.') + ':' : '') +
      `<${v1.canon}>:${v1.row}:${v1.col}` + ' ' +
      ((v1.url && v1.url !== err.url) ? ' in ' + v1.url : '') + '\n' +

      'RHS: ' +
      (0 < v2.path?.length ? v2.path.join('.') + ':' : '') +
      `<${v2.canon}>:${v2.row}:${v2.col}` + ' ' +
      ((v2.url && v2.url !== err.url) ? ' in ' + v2.url : '') + '\n' +

      ''
    return err
  }
  else {
    return err.map(n => descErr(n))
  }
}


export {
  descErr
}
