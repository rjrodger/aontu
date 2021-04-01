import { Val } from './val';
declare function AontuLang<T extends string | string[]>(src: T): (T extends string ? Val : Val[]);
export { AontuLang };
