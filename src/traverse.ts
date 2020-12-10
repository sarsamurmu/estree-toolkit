import { BaseNode, Node } from 'estree';

import { NodePath } from './nodepath';
import { lazy, Lazy } from './utils';

interface TraverserOptions {}

interface VisitorContext {}

type VisitorFn = (this: VisitorContext, path: NodePath) => boolean | void;

interface Visitors {
  [type: string]: VisitorFn | {
    enter?: VisitorFn;
    leave?: VisitorFn;
  }
}

export const createTraverser = (options: TraverserOptions) => {
  return (ast: Node, visitors: Visitors) => {
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
      node, key, listKey, getParentPath
    }: {
      node: BaseNode;
      key: string | number;
      listKey: string | undefined;
      getParentPath: Lazy<NodePath | undefined>;
    }) => {
      if (node) {
        const visitor = normalizedVisitors[node.type] || {};
        const getNodePath: Lazy<NodePath> = lazy(() => (
          new NodePath({ node, key, listKey, getParentPath })
        ));

        if (visitor.enter) {
          visitor.enter.call(visitorContext, getNodePath());
        }

        for (const key in node) {
          const value = (node as any)[key];

          if (!value) continue;

          if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) {
              if (value[i] && typeof value[i].type === 'string') {
                visit({
                  node: value[i],
                  key: i,
                  listKey: key,
                  getParentPath: getNodePath
                });
              }
            }
          } else if (typeof value.type === 'string') {
            visit({
              node: value,
              key,
              listKey: undefined,
              getParentPath: getNodePath
            });
          }
        }

        if (visitor.leave) {
          visitor.leave.call(visitorContext, getNodePath());
        }
      }
    }

    visit({
      node: ast,
      key: undefined as any,
      listKey: undefined,
      getParentPath: lazy(() => undefined)
    });
  }
}
