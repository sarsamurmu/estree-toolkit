import { Node } from 'estree';

import { Is, Matcher } from './generated/is-type';
import { definitions } from './definitions';
import { NodePath } from './nodepath';

const matches = (object: Record<string, any>, matcher: Matcher<Node>) => {
  for (const key in matcher) {
    const value = (matcher as any)[key];
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
  (is as any)[nodeType] = (nodeOrNodePath: Node | NodePath, matcher?: Matcher<Node>) => {
    // We shouldn't believe in micro-benchmarks but it seems that
    // checking for a property is faster than `instanceof` calls
    // for `NodePath`

    const node: Node | null = (nodeOrNodePath as any)[NodePath.internalKey] != null
      ? (nodeOrNodePath as NodePath).node
      : (nodeOrNodePath as Node);
    
    return (
      node != null && node.type === nodeType &&
      (matcher != null ? matches(node, matcher) : true)
    )
  }
}
