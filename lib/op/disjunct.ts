/* Copyright (c) 2021 Richard Rodger, MIT License */


import { Site } from '../lang'
import { Context } from '../unify'
import { Val, DisjunctVal } from '../val'
import { Operation } from './op'


const disjunct: Operation = (ctx?: Context, a?: Val, b?: Val) => {
  let peers: Val[] = []
  let origsites: Site[] = []
  origsites.push(append(peers, a))
  origsites.push(append(peers, b))
  let out = new DisjunctVal(peers, ctx, origsites)
  return out
}


function append(peers: Val[], v?: Val) {
  let origsite: Site = Site.NONE

  if (v instanceof DisjunctVal) {
    peers.push(...v.peg)
    origsite = v.site
  }

  // TODO: handle no-error Nil (drop) and error Nil (keep and become)
  else if (v instanceof Val) {
    peers.push(v)
  }

  return origsite
}


export {
  disjunct
}
