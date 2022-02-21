import type { Node as _Node, JSXSpreadChild, BaseNode } from 'estree-jsx'

export type Node = _Node | JSXSpreadChild

export { BaseNode }

/**
 * Causes a compiler error if a switch is not exhaustive
 * or you can say causes a compiler error if all possible switch cases
 * are not covered
 * 
 * This function would never get called in reality, if your code is correct
*/
/* istanbul ignore next */
export const assertNever = (x: never) => x

export type NodeMap = { [N in Node as `${N['type']}`]: N; }
export type NodeTypes = keyof NodeMap
export type NodeT<N extends NodeTypes> = NodeMap[N]

export type ParentsOf<N extends Node | Node[]> = {
  [K in NodeTypes]: N extends NodeMap[K][keyof NodeMap[K]] ? NodeMap[K] : never;
}[NodeTypes]

export type PossibleKeysInParent<N extends Node | Node[], P extends Node> = Exclude<{
  [K in keyof P]: N extends P[K] ? K : never;
}[keyof P], undefined>
