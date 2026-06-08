import { Jsonic } from 'jsonic';
import type { Val, AontuOptions } from './type';
import { Site } from './site';
declare class Lang {
    jsonic: Jsonic;
    opts: AontuOptions;
    idcount: number | undefined;
    constructor(options?: Partial<AontuOptions>);
    parse(src: string, opts?: Partial<AontuOptions>): Val;
}
export { Lang, Site, };
