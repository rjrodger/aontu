declare function isIntegerKind(n: number, src?: string): boolean;
declare function isIntegerStorable(n: bigint): boolean;
declare function isExactInBinary64(n: bigint): boolean;
declare function isLossyIntegerLiteral(n: number, src?: string): boolean;
export { isExactInBinary64, isIntegerKind, isIntegerStorable, isLossyIntegerLiteral, };
