import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { FuncBaseVal } from './FuncBaseVal';
import { FeatureVal } from './FeatureVal';
export type Address = {
    name: string;
    path: string[];
};
export declare function parseAddress(s: string): Address | undefined;
export declare function findEntity(reg: Map<string, Val> | undefined, addr: Address): {
    parent?: any;
    key?: string;
    val: Val;
} | undefined;
declare class ReferVal extends FeatureVal {
    isRefer: boolean;
    isGenable: boolean;
    tval: Val;
    addr?: Address;
    addrsrc?: string;
    held?: Val;
    constructor(spec: ValSpec, ctx?: AontuContext);
    unify(peer: Val, ctx: AontuContext): Val;
    with(ctx: AontuContext, spec: any, site: Val): Val;
    settle(ctx: AontuContext, site: Val): Val;
    get canon(): string;
}
declare class ReferFuncVal extends FuncBaseVal {
    isReferFunc: boolean;
    constructor(spec: ValSpec, ctx?: AontuContext);
    make(_ctx: AontuContext, spec: ValSpec): Val;
    funcname(): string;
    resolve(ctx: AontuContext, args: Val[]): ReferVal;
}
export { ReferFuncVal, ReferVal, };
