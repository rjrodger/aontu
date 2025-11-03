import { Jsonic } from 'jsonic';
import type { Val, Options } from './type';
import { Site } from './site';
declare class Lang {
    jsonic: Jsonic;
    options: Options;
    idcount: number | undefined;
    constructor(options?: Partial<Options>);
    parse(src: string, opts?: Partial<Options>): Val;
}
export { Lang, Site, };
