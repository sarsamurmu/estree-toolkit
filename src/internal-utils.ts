import { Node } from 'estree';

/**
 * Causes a compiler error if a switch is not exhaustive
 * or you can say causes a compiler error if all possible switch cases
 * are not covered
 * 
 * This function would never get called in reality, if your code is correct
*/
/* istanbul ignore next */
export const assertNever = (x: never) => x;

export type NodeMap = { [N in Node as `${N['type']}`]: N; }
export type NodeT<N extends keyof NodeMap> = NodeMap[N];
