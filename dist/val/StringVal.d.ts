import type { Val } from '../type';
import { Context } from '../unify';
import { ScalarVal } from './ScalarVal';
declare class StringVal extends ScalarVal<string> {
    isStringVal: boolean;
    constructor(spec: {
        peg: string;
    }, ctx?: Context);
    unify(peer: Val, ctx?: Context): Val;
    get canon(): string;
}
export { StringVal, };
