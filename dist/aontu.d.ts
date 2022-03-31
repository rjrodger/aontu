import { Options } from './lib/common';
import { Lang } from './lib/lang';
import { Val, Nil } from './lib/val';
declare function Aontu(src: string | Partial<Options>, popts?: Partial<Options>): Val;
declare const util: {
    options: (src: string | Partial<Options>, popts?: Partial<Options> | undefined) => Options;
};
export { Aontu, Val, Nil, Lang, util };
export default Aontu;
