import type { Val, Options } from './lib/type';
import { Lang } from './lib/lang';
import { Nil } from './lib/val/Nil';
declare function Aontu(src: string | Partial<Options>, popts?: Partial<Options>): Val;
declare const util: {
    options: (src: string | Partial<Options>, popts?: Partial<Options>) => Options;
};
export { Aontu, Val, Nil, Lang, util };
export default Aontu;
