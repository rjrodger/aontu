import { Jsonic } from 'jsonic';
import { Options } from './common';
import { Val } from './val';
declare class Lang {
    jsonic: Jsonic;
    options: Options;
    constructor(options?: Partial<Options>);
    parse(src: string, opts?: any): Val;
}
export { Lang };
