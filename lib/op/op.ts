/* Copyright (c) 2021 Richard Rodger, MIT License. */


import { Context } from '../unify'
import { Val } from '../val'

import { disjunct } from './disjunct'
import { unite } from './unite'


type Operation = (ctx: Context, a?: Val, b?: Val) => Val

export {
  Operation,
  disjunct,
  unite,
}
