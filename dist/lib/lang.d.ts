import { Jsonic } from 'jsonic';
import { Val } from './val';
declare function AontuLang<T extends string | string[]>(src: T, opts?: any): (T extends string ? Val : Val[]);
declare namespace AontuLang {
    var jsonic: Jsonic;
}
export { AontuLang };
