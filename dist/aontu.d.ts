import { Options } from './lib/common';
declare type Val = {
    canon: string;
    gen: (log: any[]) => any;
};
declare function Aontu(src: string | Partial<Options>, popts?: Partial<Options>): Val;
declare const util: {
    options: (src: string | Partial<Options>, popts?: Partial<Options> | undefined) => Options;
};
export { Aontu, Val, util, };
export default Aontu;
