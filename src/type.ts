/* Copyright (c) 2022-2025 Richard Rodger, MIT License */

import * as Fs from 'node:fs'

// TODO: refactor these out

import { Resolver } from '@jsonic/multisource'

import { AontuContext } from './ctx'
import { Val, DONE, SPREAD } from './val/Val'
import type { ValMark, ValSpec } from './val/Val'


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
  collect?: boolean // Collect errors into an errs property, rather than throw them.
  err?: any[]
  explain?: any[]
}


const DEFAULT_OPTS: () => AontuOptions = () => {
  return {
    print: -1,
    debug: false,
    trace: false,
  }
}


type ValMap = { [key: string]: Val }
type ValList = Val[]



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

