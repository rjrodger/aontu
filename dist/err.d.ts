import { Val, ErrContext } from './type';
import { AontuContext } from './ctx';
import { NilVal } from './val/NilVal';
declare function getHint(why: any): string | undefined;
declare function makeNilErr(ctx?: AontuContext, why?: any, av?: Val, bv?: Val, attempt?: string): NilVal;
declare function descErr<NILS extends NilVal | NilVal[]>(err: NILS | any, errctx?: ErrContext): any;
declare class AontuError extends Error {
    constructor(msg: string, errs?: NilVal[]);
    errs: () => NilVal[];
}
export { getHint, makeNilErr, descErr, AontuError, };
