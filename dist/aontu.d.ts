import type { Val, Options } from './lib/type';
import { Lang } from './lib/lang';
import { Context } from './lib/unify';
import { Nil } from './lib/val/Nil';
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
