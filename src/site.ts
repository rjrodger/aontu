/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
} from './type'


class Site {
  row: number = -1
  col: number = -1
  url: string = ''

  constructor(val: Val) {
    // TODO: logic to select most meaningful site if val has no site,
    // but has peg children that do.
    this.row = val.row
    this.col = val.col
    this.url = val.url
  }
}


export {
  Site,
}
