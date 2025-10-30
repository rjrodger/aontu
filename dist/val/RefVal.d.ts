import type { Val, ValSpec } from '../type';
import { Context } from '../unify';
import { StringVal } from './StringVal';
import { FeatureVal } from './FeatureVal';
declare class RefVal extends FeatureVal {
    isRef: boolean;
    absolute: boolean;
    prefix: boolean;
    constructor(spec: {
        peg: any[];
        absolute?: boolean;
        prefix?: boolean;
    }, ctx?: Context);
    append(part: any): void;
    unify(peer: Val, ctx: Context, trace?: any[]): Val;
    find(ctx: Context): StringVal | Val | undefined;
    same(peer: Val): boolean;
    clone(ctx: Context, spec?: ValSpec): Val;
    get canon(): string;
    gen(ctx?: Context): undefined;
}
export { RefVal, };
