/* Copyright (c) 2021-2024 Richard Rodger, MIT License */


import { Nil } from './val/Nil'


// TODO: move to utility?
function descErr<NILS extends Nil | Nil[]>(err: NILS | any): any {
  if (err?.isNil) {
    // console.trace()

    if (null == err.msg || '' === err.msg) {
      let v1: any = err.primary
      let v2: any = err.secondary

      // console.log(err)

      err.msg =
        'Cannot ' +
        (null == v2 ? 'resolve' : 'unify') +

        (0 < err.path?.length ? ' path ' + err.path.join('.') : '') +
        ' ' + (err.url ? 'in ' + err.url : '') + ':\n' +

        (null == v1 ? '' :
          'LHS: ' +
          (0 < v1.path?.length ? v1.path.join('.') + ':' : '') +
          `<${v1.canon}>:${v1.row}:${v1.col}` + ' ' +
          ((v1.url && v1.url !== err.url) ? ' in ' + v1.url : '') + '\n'
        ) +

        (null == v2 ? '' :
          'RHS: ' +
          (0 < v2.path?.length ? v2.path.join('.') + ':' : '') +
          `<${v2.canon}>:${v2.row}:${v2.col}` + ' ' +
          ((v2.url && v2.url !== err.url) ? ' in ' + v2.url : '') + '\n'
        ) +
        ''
    }
    return err
  }
  else {
    return err.map((n: any) => descErr(n))
  }
}


export {
  descErr
}
