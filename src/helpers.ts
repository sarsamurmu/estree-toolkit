import type { Node as _Node, JSXSpreadChild, BaseNode } from 'estree-jsx'
import type { ImportAttribute } from 'estree'

export type Node = _Node | JSXSpreadChild | ImportAttribute

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

/**
 * These codes are from https://github.com/blakeembrey/change-case, and is licensed under the MIT License.
 */

const SPLIT_LOWER_UPPER_RE = /([\p{Ll}\d])(\p{Lu})/gu
const SPLIT_UPPER_UPPER_RE = /(\p{Lu})([\p{Lu}][\p{Ll}])/gu
const SPLIT_REPLACE_VALUE = '$1\0$2'

const DEFAULT_STRIP_REGEXP = /[^\p{L}\d]+/giu

/* istanbul ignore next */
const split = (input: string) => {
  let output = input.trim()

  output = output
    .replace(SPLIT_LOWER_UPPER_RE, SPLIT_REPLACE_VALUE)
    .replace(SPLIT_UPPER_UPPER_RE, SPLIT_REPLACE_VALUE)

  output = output.replace(DEFAULT_STRIP_REGEXP, '\0')

  let start = 0
  let end = output.length

  // Trim the delimiter from around the output string.
  while (output.charAt(start) === '\0') start++
  if (start === end) return []
  while (output.charAt(end - 1) === '\0') end--

  return output.slice(start, end).split(/\0/g)
}

export const toCamelCase = (input: string) => {
  const transform = (word: string, index: number) => {
    const char0 = word[0]
    const initial =
            index > 0 && char0 >= '0' && char0 <= '9' ? '_' + char0 : char0.toLocaleUpperCase()
    return initial + word.slice(1).toLocaleLowerCase()
  }

  const words = split(input)
  const output = words
    .map((word, index) => (index === 0 ? word.toLocaleLowerCase() : transform(word, index)))
    .join('')

  return output
}

/** Creates a clean object that doesn't have any prototype */
export const cleanObj = <T>(obj: T): T => Object.assign(Object.create(null), obj) as T
