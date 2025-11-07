/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
} from './type'


class Site {
  row: number = -1
  col: number = -1
  url: string = ''

  constructor(val?: Val | { row?: number, col?: number, url?: string }) {
    if (val) {
      if ('site' in val) {
        // Val with site property
        this.row = val.site?.row ?? -1
        this.col = val.site?.col ?? -1
        this.url = val.site?.url ?? ''
      } else {
        // Plain object with row, col, url
        this.row = val.row ?? -1
        this.col = val.col ?? -1
        this.url = val.url ?? ''
      }
    }
  }
}


export {
  Site,
}
