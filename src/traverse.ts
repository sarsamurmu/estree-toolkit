import { Node } from 'estree';

import { NodePath } from './nodepath';

// TODO: Work on VisitorContext
type VisitorContext = unknown;

type VisitorFn<T extends Node = Node> = (this: VisitorContext, path: NodePath<T>) => boolean | void;
type ExpandedVisitor<T extends Node> = {
  enter?: VisitorFn<T>;
  leave?: VisitorFn<T>;
}
type Visitor<T extends Node> = VisitorFn<T> | ExpandedVisitor<T>;

type Visitors = {
  [K in Node as `${K['type']}`]?: Visitor<K>;
} & {
  [type: string]: Visitor<Node>;
}
type ExpandedVisitors = {
  [type: string]: ExpandedVisitor<Node> | undefined;
}

export class Traverser {
  visitors: ExpandedVisitors;
  pathCache: Map<Node | null, Map<Node | null, NodePath>>;

  constructor(data: {
    visitors: ExpandedVisitors;
  }) {
    this.visitors = data.visitors;
    this.pathCache = new Map();
  }

  get exports() {
    return {
      dispose: () => {
        this.pathCache.clear();
      }
    }
  }

  visitNode(data: {
    node: Node | null;
    key: string | number | null;
    listKey: string | null;
    parentPath: NodePath | null;
  }) {
    if (data.node == null) return;

    const visitorContext = {};
    const visitor = this.visitors[data.node.type] || {};
    const nodePath = NodePath.for({
      node: data.node,
      key: data.key,
      listKey: data.listKey,
      parentPath: data.parentPath,
      traverser: this
    });

    if (visitor.enter != null) {
      visitor.enter.call(visitorContext, nodePath);
    }

    for (const property in data.node) {
      const value: Node | Node[] | null | undefined = (data.node as any)[property];

      if (value == null) continue;

      if (Array.isArray(value)) {
        const childNodePaths = value.map((node, index) => (
          NodePath.for({
            node,
            key: index,
            listKey: property,
            parentPath: nodePath,
            traverser: this
          })
        ));

        for (let i = 0; i < childNodePaths.length; i++) {
          const childNodePath = childNodePaths[i];
          if (!childNodePath.removed) {
            this.visitNode({
              node: childNodePath.node,
              key: childNodePath.key,
              listKey: childNodePath.listKey,
              parentPath: childNodePath.parentPath,
            });
          }
        }
      } else if (typeof value.type === 'string') {
        this.visitNode({
          node: value,
          key: property,
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

export const traverse = (node: unknown, visitors: Visitors) => {
  const expandedVisitors: ExpandedVisitors = {};

  for (const keyName in visitors) {
    // keyName can contain multiple visitors - "FunctionExpression|FunctionDeclaration"
    const keys = keyName.split('|');
    const visitor = visitors[keyName];
    if (typeof visitor === 'function') {
      keys.forEach((key) => {
        expandedVisitors[key] = { enter: visitor };
      });
    } else if (typeof visitor === 'object') {
      keys.forEach((key) => {
        expandedVisitors[key] = visitor;
      });
    }
  }

  const traverser = new Traverser({ visitors: expandedVisitors });
  traverser.visitNode({
    node: node as Node,
    key: null,
    listKey: null,
    parentPath: null
  });

  return traverser.exports;
}
