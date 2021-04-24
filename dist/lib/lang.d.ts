import { Jsonic } from 'jsonic';
import { Options } from './common';
import { Val } from './val';
declare class Lang {
    jsonic: Jsonic;
    constructor(options?: Partial<Options>);
    parse<T extends string | string[]>(src: T, opts?: any): (T extends string ? Val : Val[]);
}
export { Lang };
