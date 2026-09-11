import type { Val, ValSpec } from '../type';
import { AontuContext } from '../ctx';
import { Val as ValBase } from './Val';
declare class AbsentVal extends ValBase {
    isAbsent: boolean;
    constructor(spec: ValSpec, ctx?: AontuContext);
    unify(peer: Val, _ctx: AontuContext): Val;
    get canon(): string;
    superior(): Val;
    gen(_ctx?: AontuContext): undefined;
}
export { AbsentVal, };
