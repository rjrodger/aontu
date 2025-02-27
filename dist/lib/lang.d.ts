import { Jsonic } from 'jsonic';
import type { Val, Options } from './type';
declare class Site {
    row: number;
    col: number;
    url: string;
    constructor(val: Val);
}
declare class Lang {
    jsonic: Jsonic;
    options: Options;
    constructor(options?: Partial<Options>);
    parse(src: string, opts?: any): Val;
}
export { Lang, Site, };
