import { RefVal, MapVal } from './val';
declare class Context {
    root: MapVal;
    constructor(cfg: any);
    find(ref: RefVal): MapVal | undefined;
}
export { Context };
