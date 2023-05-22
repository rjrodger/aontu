import type { Val, Options } from './lib/type';
import { Lang } from './lib/lang';
import { Context } from './lib/unify';
import { Nil } from './lib/val/Nil';
declare function Aontu(src: string | Partial<Options>, popts?: Partial<Options>): Val;
declare const util: {
    options: (src: string | Partial<Options>, popts?: Partial<Options>) => Options;
    parse(opts: Options, ctx: {
        deps: any;
    }): Val;
};
export { Aontu, Val, Nil, Lang, Context, util };
export default Aontu;
