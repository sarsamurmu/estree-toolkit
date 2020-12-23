import { Node } from 'estree';

import { Is, Matcher } from './generated/is-type';
import { definitions } from './definitions';
import { NodePath } from './nodepath';

const matches = (object: Record<string, any>, toMatch: Matcher<Node>) => {
  for (const key in toMatch) {
    const value = (toMatch as any)[key];
    if (typeof value == 'function') {
      if (!value(object[key])) return false;
    } else if (value !== object[key]) {
      return false;
    }
  }
  return true;
}

export const is: Is = {} as any;

for (const nodeType in definitions) {
  const lowerCasedNodeType = nodeType[0].toLowerCase() + nodeType.slice(1);

  (is as any)[lowerCasedNodeType] = (nodeOrNodePath: Node | NodePath, toMatch?: Matcher<Node>) => {
    // We shouldn't believe in micro-benchmarks but it seems that
    // checking for a property is faster than `instanceof` calls
    // for `NodePath`

    const node: Node | null = (nodeOrNodePath as NodePath).traverser != null
      ? (nodeOrNodePath as NodePath).node
      : (nodeOrNodePath as Node);
    
    return (
      node != null && node.type === nodeType &&
      (toMatch != null ? matches(node, toMatch) : true)
    )
  }
}
