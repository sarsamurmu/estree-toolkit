import { Node } from 'estree';

import { Context, NodePath } from './nodepath';
import { visitorKeys } from './definitions';

export type VisitorFn<T extends Node = Node, S = unknown> = (path: NodePath<T>, state: S) => boolean | void;
export type ExpandedVisitor<T extends Node, S> = {
  enter?: VisitorFn<T, S>;
  leave?: VisitorFn<T, S>;
}
export type Visitor<T extends Node = Node, S = unknown> = VisitorFn<T, S> | ExpandedVisitor<T, S>;

export type Visitors<S> = {
  [K in Node as `${K['type']}`]?: Visitor<K, S>;
}
export type ExpandedVisitors<S = unknown> = {
  [type: string]: ExpandedVisitor<Node, S> | undefined;
}

export type TraverseOptions = { scope?: boolean };

export class Traverser {
  private readonly visitors: ExpandedVisitors;
  private readonly ctx: Context;

  constructor(data: {
    visitors: ExpandedVisitors<any>;
    ctx: Context;
  }) {
    this.visitors = data.visitors;
    this.ctx = data.ctx;
  }

  visitNode<S>(data: {
    node: Node | null;
    key: string | number | null;
    listKey: string | null;
    parentPath: NodePath | null;
    state: S | undefined;
    onlyChildren?: boolean;
  }) {
    if (data.node == null) return;

    const { node, state } = data;
    const visitor = this.visitors[node.type] || {};
    const nodePath = NodePath.for({
      node: node,
      key: data.key,
      listKey: data.listKey,
      parentPath: data.parentPath,
      ctx: this.ctx
    });

    if (!data.onlyChildren) {
      nodePath.init();

      if (this.ctx.shouldSkip(nodePath)) return;

      if (visitor.enter != null) {
        visitor.enter(nodePath, state);

        if (this.ctx.shouldSkip(nodePath)) return;
      }
    }

    const keys = visitorKeys[node.type] || Object.keys(node);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value: Node | Node[] | null | undefined = (node as any)[key];

      if (value == null) continue;

      if (Array.isArray(value)) {
        const childNodePaths = value.map((node, index) => (
          NodePath.for({
            node,
            key: index,
            listKey: key,
            parentPath: nodePath,
            ctx: this.ctx
          }).init()
        ));

        for (let i = 0; i < childNodePaths.length; i++) {
          const childNodePath = childNodePaths[i];
          if (!childNodePath.removed) {
            this.visitNode({
              node: childNodePath.node,
              key: childNodePath.key,
              listKey: childNodePath.listKey,
              parentPath: childNodePath.parentPath,
              state: state
            });
          }
        }
      } else if (typeof value.type === 'string') {
        this.visitNode({
          node: value,
          key: key,
          listKey: null,
          parentPath: nodePath,
          state: state
        });
      }
    }

    if (!data.onlyChildren && visitor.leave != null) {
      visitor.leave(nodePath, state);
    }
  }

  static expandVisitors<S = unknown>(visitors: Visitors<S>): ExpandedVisitors<S> {
    const expandedVisitors: ExpandedVisitors = {};

    for (const keyName in visitors) {
      const keys = keyName.split('|');
      const visitor: VisitorFn<Node> = (visitors as any)[keyName];
      if (typeof visitor == 'function') {
        for (let i = 0; i < keys.length; i++) {
          expandedVisitors[keys[i]] = { enter: visitor };
        }
      } else if (typeof visitor == 'object') {
        for (let i = 0; i < keys.length; i++) {
          expandedVisitors[keys[i]] = visitor;
        }
      }
    }

    return expandedVisitors;
  }

  static traverseNode<S = unknown>(data: {
    node: Node;
    parentPath: NodePath | null;
    state: S | undefined;
    ctx: Context;
    onlyChildren?: boolean;
  } & ({
    expand: true;
    visitors: Visitors<S>;
  } | {
    expand: false;
    visitors: ExpandedVisitors<S>;
  })) {
    new Traverser({
      visitors: data.expand ? this.expandVisitors(data.visitors) : data.visitors,
      ctx: data.ctx
    }).visitNode({
      node: data.node,
      key: null,
      listKey: null,
      parentPath: data.parentPath,
      state: data.state,
      onlyChildren: data.onlyChildren
    });
  }
}

export const traverse = <N, S>(node: N, visitors: Visitors<S> & { $?: TraverseOptions }, state?: S) => {
  const ctx = new Context(visitors.$);

  if ((node as unknown as Node).type !== 'Program') {
    ctx.makeScope = false;
  }

  Traverser.traverseNode({
    node: node as unknown as Node,
    parentPath: null,
    visitors,
    state,
    ctx,
    expand: true,
  });
}
