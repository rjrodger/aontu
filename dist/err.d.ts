import { ErrContext } from './type';
import { AontuContext } from './ctx';
import { NilVal } from './val/NilVal';
declare function makeNilErr(ac: AontuContext, code: string, details?: Record<string, any>): NilVal;
declare function descErr<NILS extends NilVal | NilVal[]>(err: NILS | any, errctx?: ErrContext): any;
declare class AontuError extends Error {
    constructor(msg: string, errs?: NilVal[]);
    errs: () => NilVal[];
}
export { makeNilErr, descErr, AontuError, };
