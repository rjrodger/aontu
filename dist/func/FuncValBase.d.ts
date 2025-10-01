import { Context } from '../unify';
import { ValBase } from '../val/ValBase';
declare class FuncValBase extends ValBase {
    isFuncVal: boolean;
    constructor(spec: {
        peg: any;
    }, ctx?: Context);
}
export { FuncValBase, };
