/* eslint-disable @typescript-eslint/no-empty-interface */
import { Node } from 'estree';

import { NodePath } from './nodepath';

interface VisitorContext {}

type VisitorFn<T extends Node = Node> = (this: VisitorContext, path: NodePath<T>) => boolean | void;
type Visitor<T extends Node> = VisitorFn<T> | {
  enter?: VisitorFn<T>;
  leave?: VisitorFn<T>;
}

type Visitors = {
  [K in Node as `${K['type']}`]?: Visitor<K>;
} & {
  [type: string]: Visitor<Node>;
}

export const traverse = (ast: Node, visitors: Visitors) => {
  const normalizedVisitors: {
    [type: string]: Exclude<Visitors[string], VisitorFn> | null;
  } = {};

  for (const keyName in visitors) {
    // keyName can contain multiple visitors - "FunctionExpression|FunctionDeclaration"
    const keys = keyName.split('|');
    const visitor = visitors[keyName];
    if (typeof visitor === 'function') {
      keys.forEach((key) => {
        normalizedVisitors[key] = { enter: visitor };
      });
    } else if (typeof visitor === 'object') {
      keys.forEach((key) => {
        normalizedVisitors[key] = visitor;
      });
    }
  }

  const visitorContext: VisitorContext = {};

  const visit = ({
    node, key, listKey, parentPath
  }: {
    node: Node;
    key: string | number;
    listKey: string | null;
    parentPath: NodePath | null;
  }) => {
    if (node) {
      const visitor = normalizedVisitors[node.type] || {};
      const nodePath = new NodePath({
        node,
        key: key as Node['type'],
        listKey: listKey as Node['type'],
        parentPath
      });

      if (visitor.enter != null) {
        visitor.enter.call(visitorContext, nodePath);
      }

      for (const key in node) {
        const value = (node as any)[key];

        if (!value) continue;

        if (Array.isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            if (value[i] != null && typeof value[i].type === 'string') {
              visit({
                node: value[i],
                key: i,
                listKey: key,
                parentPath: nodePath
              });
            }
          }
        } else if (typeof value.type === 'string') {
          visit({
            node: value,
            key,
            listKey: null,
            parentPath: nodePath
          });
        }
      }

      if (visitor.leave != null) {
        visitor.leave.call(visitorContext, nodePath);
      }
    }
  }

  visit({
    node: ast,
    key: null as any,
    listKey: null,
    parentPath: null
  });
}
