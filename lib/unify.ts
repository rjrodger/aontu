/* Copyright (c) 2021 Richard Rodger, MIT License */

import {
  Val,
  RefVal,
  MapVal,
} from './val'


class Context {
  root: MapVal
  constructor(cfg: any) {
    this.root = cfg.root
  }

  find(ref: RefVal) {

    // TODO: relative paths
    if (ref.absolute) {
      let node: MapVal = this.root
      let pI = 0
      for (; pI < ref.parts.length && node instanceof MapVal; pI++) {
        let part = ref.parts[pI]
        node = node.val[part]
      }

      if (pI === ref.parts.length) {
        return node
      }
    }
  }
}


export {
  Context
}
