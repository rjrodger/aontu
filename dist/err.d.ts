import { ErrContext } from './type';
import { NilVal } from './val/NilVal';
declare function descErr<NILS extends NilVal | NilVal[]>(err: NILS | any, errctx?: ErrContext): any;
export { descErr };
