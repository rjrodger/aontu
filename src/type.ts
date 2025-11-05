/* Copyright (c) 2022-2025 Richard Rodger, MIT License */

import * as Fs from 'node:fs'

// TODO: refactor these out

import { Resolver } from '@jsonic/multisource'

import { AontuContext } from './ctx'


type FST = typeof Fs



type AontuOptions = {
  src?: string    // Source text.
  print?: number  // Print debug verbosity
  resolver?: Resolver // Source resolver
  base?: string // Base path for resolver
  path?: string // Path of entry file
  debug?: boolean
  trace?: boolean
  fs?: FST
  deps?: any
  log?: any
  idcount?: number
  collect: boolean // Collect errors into an errs property, rather than throw them.
}


const DEFAULT_OPTS: AontuOptions = {
  collect: true,
  print: -1,
  debug: false,
  trace: false,
}


interface Val {
  isVal: boolean
  isTop: boolean
  isNil: boolean

  isMap: boolean
  isList: boolean
  isScalar: boolean
  isScalarKind: boolean
  isConjunct: boolean
  isDisjunct: boolean
  isJunction: boolean
  isPref: boolean
  isRef: boolean
  isVar: boolean
  isBag: boolean
  isNumber: boolean
  isInteger: boolean
  isString: boolean
  isBoolean: boolean

  isOp: boolean
  isPlusOp: boolean

  isFunc: boolean
  isCloseFunc: boolean
  isCopyFunc: boolean
  isHideFunc: boolean
  isMoveFunc: boolean
  isKeyFunc: boolean
  isLowerFunc: boolean
  isOpenFunc: boolean
  isPathFunc: boolean
  isPrefFunc: boolean
  isSuperFunc: boolean
  isTypeFunc: boolean
  isUpperFunc: boolean


  id: number
  dc: number
  path: string[]
  row: number
  col: number
  url: string

  // Map of boolean flags.
  mark: ValMark

  // Child value(s).
  peg: any

  // err: Omit<any[], "push">
  err: any[]
  explain: any[] | null

  deps?: any

  get done(): boolean

  same(peer: Val): boolean

  clone(ctx: AontuContext, spec?: ValSpec): Val

  // get site(): Site
  unify(peer: Val, ctx: AontuContext, trace?: any[]): Val

  get canon(): string

  gen(ctx: AontuContext): any

  superior(): Val
}


type ValMark = {
  type: boolean,
  hide: boolean,

  // Custom marks must have _ prefix.
  [name: `_${string}`]: boolean,
}

type ValSpec = {
  peg?: any,
  mark?: Partial<ValMark>,
  kind?: any,
  row?: number,
  col?: number,
  url?: string,
  path?: string[],
  id?: number,
  src?: string,

  // NilVal specific
  why?: string,
  msg?: string,
  err?: any[] | any,

  // RefVal specific
  absolute?: boolean,
  prefix?: boolean,
}
type ValMap = { [key: string]: Val }
type ValList = Val[]



const DONE = -1

const SPREAD = Symbol('spread')



type ErrContext = {
  src?: string,
  fs?: FST
}

export type {
  Val,
  ValMark,
  ValSpec,
  ValMap,
  ValList,
  AontuOptions,
  ErrContext,
  FST,
}

export {
  DONE,
  SPREAD,
  DEFAULT_OPTS,
  Resolver,
}

