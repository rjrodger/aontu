import { Val, RefVal, MapVal } from './val';
declare class Context {
    root: MapVal;
    constructor(cfg: any);
    find(ref: RefVal): MapVal | undefined;
}
declare class Unify {
    root: Val;
    res: Val;
    dc: number;
    constructor(root: Val | string);
}
export { Context, Unify, };
