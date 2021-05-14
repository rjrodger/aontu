import { Resolver } from '@jsonic/multisource';
import { Options } from './lib/common';
import { Val } from './lib/val';
declare function Aontu(src: string | Partial<Options>, popts?: Partial<Options>): Val;
declare const util: {
    options: (src: string | Partial<Options>, popts?: Partial<Options> | undefined) => Options;
};
export { Aontu, Val, Resolver, util };
export default Aontu;
