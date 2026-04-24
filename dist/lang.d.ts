import { Jsonic } from 'jsonic';
import type { Val, AontuOptions } from './type';
import { Site } from './site';
import { PathVal } from './val/PathVal';
import { KeyFuncVal } from './val/KeyFuncVal';
declare class Lang {
    jsonic: Jsonic;
    opts: AontuOptions;
    idcount: number | undefined;
    paths: PathVal[];
    keys: KeyFuncVal[];
    constructor(options?: Partial<AontuOptions>);
    parse(src: string, opts?: Partial<AontuOptions>): Val;
}
export { Lang, PathVal, KeyFuncVal, Site, };
