import { Context } from '../unify';
import { Val } from '../val';
import { disjunct } from './disjunct';
import { unite } from './unite';
declare type Operation = (ctx: Context, a?: Val, b?: Val) => Val;
export { Operation, disjunct, unite, };
