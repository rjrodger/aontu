declare type Val = {
    canon: string;
    gen: (log: any[]) => any;
};
declare type Options = {
    src: string;
    print: number;
};
declare function Aontu(src: string | Partial<Options>, popts?: Partial<Options>): Val;
declare const util: {
    options: (src: string | Partial<Options>, popts?: Partial<Options> | undefined) => Options;
};
export { Aontu, Val, util, };
export default Aontu;
