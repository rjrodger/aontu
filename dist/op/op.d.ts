import { Context } from '../unify';
import { Val } from '../type';
import { unite } from './unite';
type Operation = (ctx: Context, a?: Val, b?: Val, whence?: string) => Val;
export { Operation, unite, };
