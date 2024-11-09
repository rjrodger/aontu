import { Nil } from './val/Nil';
declare function descErr<NILS extends Nil | Nil[]>(err: NILS | any, ctx?: any): any;
export { descErr };
