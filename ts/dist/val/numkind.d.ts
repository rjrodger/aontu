declare function isIntegerKind(n: number, src?: string): boolean;
declare function isIntegerStorable(n: bigint): boolean;
declare function isExactInBinary64(n: bigint): boolean;
declare function isLossyIntegerLiteral(n: number, src?: string): boolean;
declare function integerDigits(peg: number): string;
export { integerDigits, isExactInBinary64, isIntegerKind, isIntegerStorable, isLossyIntegerLiteral, };
