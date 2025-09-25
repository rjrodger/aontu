import { ErrContext } from './type';
import { Nil } from './val/Nil';
declare function descErr<NILS extends Nil | Nil[]>(err: NILS | any, errctx?: ErrContext): any;
export { descErr };
