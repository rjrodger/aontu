import { Jsonic } from '@jsonic/jsonic-next';
import { Options } from './common';
import { Val } from './val';
declare class Site {
    row: number;
    col: number;
    url: string;
    static NONE: Site;
    constructor(val: Val);
}
declare const includeFileResolver: import("@jsonic/multisource").Resolver;
declare class Lang {
    jsonic: Jsonic;
    options: Options;
    constructor(options?: Partial<Options>);
    parse(src: string, opts?: any): Val;
}
export { Lang, Site, includeFileResolver, };
