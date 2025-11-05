import type { Val, AontuOptions } from './type';
import { Lang } from './lang';
import { AontuContext, AontuContextConfig } from './ctx';
import { formatExplain } from './utility';
declare class Aontu {
    opts: Record<string, any>;
    lang: Lang;
    constructor(popts?: Partial<AontuOptions>);
    ctx(arg?: AontuContextConfig): AontuContext;
    parse(src: string, opts?: AontuOptions, ac?: AontuContext): Val | undefined;
    unify(src: string | Val, opts?: AontuOptions, ac?: AontuContext | any): Val;
    generate(src: string, meta?: any): any;
}
declare function prepareOptions(src?: string | Partial<AontuOptions>, popts?: Partial<AontuOptions>): AontuOptions;
declare function runparse(src: string, lang: Lang, ctx: AontuContext): Val;
declare const util: {
    runparse: typeof runparse;
    options: typeof prepareOptions;
};
export { Aontu, AontuOptions, AontuContext, Val, Lang, runparse, util, formatExplain };
export default Aontu;
