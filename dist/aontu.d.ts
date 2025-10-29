import type { Val, Options } from './type';
import { Lang } from './lang';
import { Context } from './unify';
import { NilVal } from './val';
import { formatExplain } from './utility';
type AontuOptions = {};
declare class AontuX {
    opts: any;
    lang: Lang;
    constructor(popts?: Partial<AontuOptions>);
    ctx(arg?: AontuContextConfig | AontuContext): AontuContext;
    parse(src: string, ac?: AontuContext): Val | undefined;
    unify(src: string | Val, ac?: AontuContext | any): Val | undefined;
    generate(src: string, meta?: any): any;
}
type AontuContextConfig = {
    root?: Val;
    path?: [];
    err?: Omit<NilVal[], "push">;
    explain?: any[];
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
declare function parse(lang: Lang, opts: Options, ctx: {
    deps: any;
}): Val;
declare const util: {
    parse: typeof parse;
    options: typeof prepareOptions;
};
export { Aontu, Val, NilVal, Lang, Context, parse, util, AontuX, formatExplain };
export default Aontu;
