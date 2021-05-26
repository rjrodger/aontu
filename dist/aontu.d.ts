import { Resolver } from '@jsonic/multisource';
import { Options } from './lib/common';
import { Val, Nil } from './lib/val';
declare function Aontu(src: string | Partial<Options>, popts?: Partial<Options>): Val;
declare const util: {
    options: (src: string | Partial<Options>, popts?: Partial<Options> | undefined) => Options;
};
export { Aontu, Val, Nil, Resolver, util };
export default Aontu;
