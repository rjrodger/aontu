import type { Val } from '../type';
import { AontuContext } from '../ctx';
type Member = {
    key: string;
    val: Val;
};
declare function bagMembers(data: any, ctx: AontuContext): Member[] | undefined;
declare function memberVals(data: any, ctx: AontuContext): Val[] | undefined;
export { bagMembers, memberVals, };
