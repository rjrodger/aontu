import type { Val, Options } from './type';
import { Lang } from './lang';
import { Context } from './unify';
import { NilVal } from './val';
type AontuOptions = {};
declare class AontuX {
    opts: any;
    constructor(popts?: Partial<AontuOptions>);
    ctx(arg?: AontuContextConfig | AontuContext): AontuContext;
    parse(src: string, ac?: AontuContext): Val | undefined;
    unify(src: string | Val, ac?: AontuContext): Val | undefined;
    generate(src: string, meta?: any): any;
}
type AontuContextConfig = {
    root?: Val;
    path?: [];
    err?: Omit<NilVal[], "push">;
    vc?: number;
    cc?: number;
    var?: Record<string, Val>;
    src?: string;
    seenI?: number;
    seen?: Record<string, number>;
};
declare class AontuContext extends Context {
    constructor(cfg?: AontuContextConfig);
}
declare function Aontu(src?: string | Partial<Options>, popts?: Partial<Options>): Val;
declare function prepareOptions(src?: string | Partial<Options>, popts?: Partial<Options>): Options;
declare function parse(opts: Options, ctx: {
    deps: any;
}): Val;
declare const util: {
    parse: typeof parse;
    options: typeof prepareOptions;
};
export { Aontu, Val, NilVal, Lang, Context, parse, util, AontuX };
export default Aontu;
