/* Copyright (c) 2022-2023 Richard Rodger, MIT License */

import * as Fs from 'node:fs'

// TODO: refactor these out

import { Resolver } from '@jsonic/multisource'

import { Context } from './unify'

import {
  Site
} from './lang'



type FST = typeof Fs

type Options = {
  src: string    // Source text.
  print: number  // Print debug verbosity
  resolver?: Resolver // Source resolver
  base?: string // Base path for resolver
  path?: string // Path of entry file
  debug?: boolean
  trace?: boolean
  fs?: FST
  deps?: any
  log?: any
  idcount?: number
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
  // err: any[]
  err: Omit<any[], "push">

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


type ErrContext = {
  src?: string,
  fs?: FST
}

export type {
  Val,
  ValSpec,
  ValMap,
  ValList,
  Options,
  ErrContext,
  FST,
}

export {
  DONE,
  Resolver,
}

