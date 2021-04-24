import { Val, RefVal, MapVal } from './val';
import { Lang } from './lang';
declare class Context {
    root: MapVal;
    constructor(cfg: any);
    find(ref: RefVal): MapVal | undefined;
}
declare class Unify {
    root: Val;
    res: Val;
    dc: number;
    lang: Lang;
    constructor(root: Val | string, lang?: Lang);
}
export { Context, Unify, };
