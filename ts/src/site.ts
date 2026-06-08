/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
} from './type'


type SiteSpec = { row?: number, col?: number, url?: string }

class Site {
  row: number
  col: number
  url: string

  constructor(val?: Val | SiteSpec) {
    const site = ((val as any)?.site ?? val) as SiteSpec

    this.row = site?.row ?? -1
    this.col = site?.col ?? -1
    this.url = site?.url ?? ''
  }
}


export {
  Site,
}
