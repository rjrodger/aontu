import { Jsonic, Context } from 'jsonic';
declare type Options = {
    src: string;
    print: number;
    resolver: Resolver;
};
declare type Resolver = (path: string, jsonic: Jsonic, ctx: Context, opts: any) => any;
export { Options };
