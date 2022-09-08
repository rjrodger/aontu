/* Copyright (c) 2022 Richard Rodger, MIT License */


// TODO: refactor these out

import { Resolver } from '@jsonic/multisource'

import { Context } from './unify'

import {
  Site
} from './lang'



type Options = {
  src: string,    // Source text.
  print: number,  // Print debug verbosity
  resolver?: Resolver, // Source resolver
  base?: string, // Base path for resolver
}




interface Val {
  id: number
  done: number
  path: string[]
  row: number
  col: number
  url: string

  top?: boolean

  // Actual native value.
  peg?: any

  // TODO: used for top level result - not great
  err?: any[]
  deps?: any

  same(peer: Val): boolean

  get site(): Site

  unify(peer: Val, ctx?: Context): Val
  get canon(): string
  gen(ctx?: Context): any
}


type ValMap = { [key: string]: Val }
type ValList = Val[]



const DONE = -1


// There can be only one.
const TOP: Val = {
  id: 0,
  top: true,
  peg: undefined,
  done: DONE,
  path: [],
  row: -1,
  col: -1,
  url: '',

  unify(peer: Val, _ctx: Context): Val {
    return peer
  },

  get canon() { return 'top' },

  get site() { return new Site(this) },

  same(peer: Val): boolean {
    return TOP === peer
  },

  gen: (_ctx?: Context) => {
    return undefined
  },

}



export type {
  Val,
  ValMap,
  ValList,
  Options,
}

export {
  DONE,
  TOP,
  Resolver,
}

