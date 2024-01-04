/* Copyright (c) 2022-2023 Richard Rodger, MIT License */


// TODO: refactor these out

import { Resolver } from '@jsonic/multisource'

import { Context } from './unify'

import {
  Site
} from './lang'



type Options = {
  src: string    // Source text.
  print: number  // Print debug verbosity
  resolver?: Resolver // Source resolver
  base?: string // Base path for resolver
  path?: string // Path of entry file
  debug?: boolean
}




interface Val {
  isVal: boolean

  id: number
  done: number
  path: string[]
  row: number
  col: number
  url: string

  top: boolean

  // Actual native value.
  peg: any

  // TODO: used for top level result - not great
  err: any[]
  deps?: any

  same(peer: Val): boolean

  // TODO: reverse args, as spec is mostly only used internally?
  clone(spec?: ValSpec, ctx?: Context): Val

  // get site(): Site
  unify(peer: Val, ctx?: Context): Val
  get canon(): string
  gen(ctx?: Context): any
}

type ValSpec = {
  peg?: any,
  [name: string]: any,
} | null
type ValMap = { [key: string]: Val }
type ValList = Val[]



const DONE = -1


export type {
  Val,
  ValSpec,
  ValMap,
  ValList,
  Options,
}

export {
  DONE,
  Resolver,
}

