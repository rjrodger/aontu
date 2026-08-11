import type { Val, AontuOptions } from './type';
import { Lang } from './lang';
import { AontuContext, AontuContextConfig } from './ctx';
import { Decimal } from './val/Decimal';
import { exactJSON } from './exactjson';
import { formatExplain } from './utility';
import { AontuError } from './err';
declare const VERSION = "0.50.1";
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
export { VERSION, Aontu, AontuOptions, AontuContext, AontuError, Val, Lang, runparse, util, formatExplain, exactJSON, Decimal, };
export default Aontu;
