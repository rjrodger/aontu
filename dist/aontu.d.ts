import type { Val, AontuOptions } from './type';
import { Lang } from './lang';
import { AontuContext, AontuContextConfig } from './ctx';
import { formatExplain } from './utility';
declare class Aontu {
    opts: AontuOptions;
    lang: Lang;
    constructor(popts?: AontuOptions);
    ctx(cfg?: AontuContextConfig): AontuContext;
    parse(src: string, opts?: AontuOptions, ac?: AontuContext): Val | undefined;
    unify(src: string | Val, opts?: AontuOptions, ac?: AontuContext | any): Val;
    generate(src: string, opts?: any, ac?: AontuContext): any;
}
declare function runparse(src: string, lang: Lang, ctx: AontuContext): Val;
declare const util: {
    runparse: typeof runparse;
};
export { Aontu, AontuOptions, AontuContext, Val, Lang, runparse, util, formatExplain };
export default Aontu;
