import type { Val } from '../type';
import { Context } from '../unify';
import { FuncValBase } from './FuncValBase';
declare class FloorFuncVal extends FuncValBase {
    isFloorFuncVal: boolean;
    constructor(spec: {
        peg: any;
    }, ctx?: Context);
    unify(peer: Val, ctx?: Context): Val;
    get canon(): string;
}
export { FloorFuncVal, };
