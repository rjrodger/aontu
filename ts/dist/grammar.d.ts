import { AontuContext } from './ctx';
declare const PARSE_STEP_MAX = 100000;
declare const PARSE_CHECK_EVERY = 100;
declare function compileGrammar(src: string): [any, string | undefined];
declare function parseWith(grammar: any, text: string, _ctx: AontuContext): [
    any,
    string | undefined
];
export { compileGrammar, parseWith, PARSE_STEP_MAX, PARSE_CHECK_EVERY, };
