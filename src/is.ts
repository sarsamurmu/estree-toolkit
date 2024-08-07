import { Node } from './estree'

import { Is, Matcher } from './generated/is-type'
import { definitions } from './definitions'
import { aliases } from './aliases'
import { NodePath } from './nodepath'
import { toCamelCase } from './string'

const matches = (object: Record<string, any>, toMatch: Matcher<Node>) => {
  for (const key in toMatch) {
    const value = (toMatch as any)[key]
    if (typeof value == 'function') {
      if (!value(object[key], object)) return false
    } else if (value !== object[key]) {
      return false
    }
  }
  return true
}

export const is: Is = {} as any

for (const nodeType in definitions) {
  (is as any)[toCamelCase(nodeType)] = (
    nodeOrNodePath: Node | NodePath | null | undefined,
    toMatch?: Matcher<Node>
  ) => {
    if (nodeOrNodePath == null) return false

    // We shouldn't believe in micro-benchmarks but it seems that
    // checking for a property is faster than `instanceof` calls
    // for `NodePath`

    const node: Node | null = (nodeOrNodePath as NodePath).ctx != null
      ? (nodeOrNodePath as NodePath).node
      : (nodeOrNodePath as Node)

    return (
      node != null && node.type === nodeType &&
      (toMatch != null ? matches(node, toMatch) : true)
    )
  }
}

for (const aliasName in aliases) {
  (is as any)[toCamelCase(aliasName)] = (
    nodeOrNodePath: Node | NodePath | null | undefined,
    toMatch?: Matcher<Node>
  ) => {
    if (nodeOrNodePath == null) return false

    const node: Node | null = (nodeOrNodePath as NodePath).ctx != null
      ? (nodeOrNodePath as NodePath).node
      : (nodeOrNodePath as Node)

    return (
      node != null && (node.type in aliases[aliasName as keyof typeof aliases]) &&
      (toMatch != null ? matches(node, toMatch) : true)
    )
  }
}
