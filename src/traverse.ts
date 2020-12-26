import { Node } from 'estree';

import { Context, NodePath } from './nodepath';

export type VisitorFn<T extends Node = Node> = (path: NodePath<T>) => boolean | void;
export type ExpandedVisitor<T extends Node> = {
  enter?: VisitorFn<T>;
  leave?: VisitorFn<T>;
}
export type Visitor<T extends Node> = VisitorFn<T> | ExpandedVisitor<T>;

export type Visitors = {
  [K in Node as `${K['type']}`]?: Visitor<K>;
}
export type ExpandedVisitors = {
  [type: string]: ExpandedVisitor<Node> | undefined;
}

export type TraverseOptions = { scope: boolean };

export class Traverser {
  private readonly visitors: ExpandedVisitors;
  private readonly ctx: Context;

  constructor(data: {
    visitors: ExpandedVisitors;
    options?: TraverseOptions;
    ctx?: Context;
  }) {
    this.visitors = data.visitors;
    if (data.ctx == null) {
      this.ctx = new Context();
      if (data.options?.scope === false) this.ctx.makeScope = false;
    } else {
      this.ctx = data.ctx;
    }
  }

  visitNode(data: {
    node: Node | null;
    key: string | number | null;
    listKey: string | null;
    parentPath: NodePath | null;
  }) {
    if (data.node == null) return;

    const visitor = this.visitors[data.node.type] || {};
    const nodePath = NodePath.for(this.ctx, {
      node: data.node,
      key: data.key,
      listKey: data.listKey,
      parentPath: data.parentPath
    }).init(this.ctx);

    if (visitor.enter != null) {
      visitor.enter(nodePath);
    }

    for (const property in data.node) {
      const value: Node | Node[] | null | undefined = (data.node as any)[property];

      if (value == null) continue;

      if (Array.isArray(value)) {
        const childNodePaths = value.map((node, index) => (
          NodePath.for(this.ctx, {
            node,
            key: index,
            listKey: property,
            parentPath: nodePath
          }).init(this.ctx)
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
      visitor.leave(nodePath);
    }
  }

  static traverseNode(data: {
    node: Node;
    visitors: Visitors;
    options?: TraverseOptions;
    ctx?: Context;
  }) {
    const expandedVisitors: ExpandedVisitors = {};

    for (const keyName in data.visitors) {
      // keyName can contain multiple visitors - "FunctionExpression|FunctionDeclaration"
      const keys = keyName.split('|');
      const visitor: VisitorFn<Node> = (data.visitors as any)[keyName];
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

    new Traverser({
      visitors: expandedVisitors,
      options: data.options,
      ctx: data.ctx
    }).visitNode({
      node: data.node,
      key: null,
      listKey: null,
      parentPath: null
    });
  }
}

export const traverse = (node: unknown, visitors: Visitors, options?: TraverseOptions) => {
  Traverser.traverseNode({
    node: node as Node,
    visitors,
    options: options
  });
}
