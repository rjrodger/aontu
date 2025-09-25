import type { Val, Options } from './type';
import { Lang } from './lang';
import { Context } from './unify';
import { Nil } from './val/Nil';
declare function Aontu(src: string | Partial<Options>, popts?: Partial<Options>): Val;
declare function prepareOptions(src: string | Partial<Options>, popts?: Partial<Options>): Options;
declare function parse(opts: Options, ctx: {
    deps: any;
}): Val;
declare const util: {
    parse: typeof parse;
    options: typeof prepareOptions;
};
export { Aontu, Val, Nil, Lang, Context, parse, util };
export default Aontu;
