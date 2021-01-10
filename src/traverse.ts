import { Node } from 'estree';

import { Context, NodePath } from './nodepath';
import { aliases, AliasMap, visitorKeys } from './definitions';

export type VisitorContext = {
  stopped: boolean;
  stop(): void;
};

export type VisitorFn<T extends Node = Node, S = unknown> = (
  this: VisitorContext,
  path: NodePath<T>,
  state: S
) => void;

export type ExpandedVisitor<T extends Node, S> = {
  enter?: VisitorFn<T, S>;
  leave?: VisitorFn<T, S>;
}

export type Visitor<T extends Node = Node, S = unknown> = VisitorFn<T, S> | ExpandedVisitor<T, S>;

export type Visitors<S> = {
  [K in Node as `${K['type']}`]?: Visitor<K, S>;
} & {
  [K in keyof AliasMap]?: Visitor<AliasMap[K], S>;
}
export type ExpandedVisitors<S = unknown> = {
  [type: string]: ExpandedVisitor<Node, S> | undefined;
}

export type TraverseOptions = { scope?: boolean };

export class Traverser {
  private readonly visitors: ExpandedVisitors;

  constructor(visitors: ExpandedVisitors<any>) {
    this.visitors = visitors;
  }

  visitPath<S>(
    visitorCtx: VisitorContext,
    path: NodePath,
    state: S,
    visitedPaths: WeakSet<NodePath>,
    onlyChildren = false
  ) {
    const { node, ctx } = path;
    if (
      visitedPaths.has(path) ||
      path.removed ||
      node == null
    ) {
      return;
    }

    const nodeType = node.type;
    const visitor = this.visitors[nodeType] || {};

    ctx.newQueue();
    const cleanup = () => ctx.popQueue();

    if (!onlyChildren) {
      // NOTE: If ctx.makeScope is `false`, it can cause the parent scope to reset to `null`
      path.init();

      if (ctx.shouldSkip(path)) return cleanup();

      if (visitor.enter != null) {
        visitor.enter.call(visitorCtx, path, state);

        if (ctx.shouldSkip(path) || visitorCtx.stopped) return cleanup();
      }
    }

    const keys = visitorKeys[nodeType] || Object.keys(node);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value: Node | Node[] | null | undefined = (node as any)[key];

      if (value == null) continue;

      if (Array.isArray(value)) {
        const childNodePaths = value.map((childNode, index) => (
          NodePath.for({
            node: childNode,
            key: index,
            listKey: key,
            parentPath: path,
            ctx: ctx
          }).init()
        ));

        for (let i = 0; i < childNodePaths.length; i++) {
          this.visitPath(visitorCtx, childNodePaths[i], state, visitedPaths);

          if (visitorCtx.stopped) return cleanup();
        }
      } else if (typeof value.type === 'string') {
        this.visitPath(
          visitorCtx,
          NodePath.for({
            node: value,
            key: key,
            listKey: null,
            parentPath: path,
            ctx: ctx
          }).init(),
          state,
          visitedPaths
        );

        if (visitorCtx.stopped) return cleanup();
      }
    }

    if (!onlyChildren && visitor.leave != null) {
      visitor.leave.call(visitorCtx, path, state);

      if (visitorCtx.stopped) return cleanup();
    }

    visitedPaths.add(path);

    const { new: newPaths, unSkipped: unSkippedPaths } = cleanup();
    
    for (let i = 0; i < newPaths.length; i++) {
      if (visitorCtx.stopped) break;
      this.visitPath(visitorCtx, newPaths[i], state, visitedPaths);
    }
    for (let i = 0; i < unSkippedPaths.length; i++) {
      if (visitorCtx.stopped) break;
      this.visitPath(visitorCtx, unSkippedPaths[i], state, visitedPaths);
    }
  }

  static expandVisitors<S = unknown>(visitors: Visitors<S>): ExpandedVisitors<S> {
    const expandedVisitors: ExpandedVisitors = Object.create(null);

    // You can use functional approach here
    // Because this code won't run many times like other code does

    Object.keys(visitors).forEach((keyName) => {
      const keys = ([] as string[]).concat(...keyName.split('|').map(
        (key) => key in aliases ? Object.keys((aliases as any)[key]) : [key]
      ));
      const visitor = (visitors as Record<string, Visitor<Node>>)[keyName];
      if (typeof visitor == 'function') {
        keys.forEach((key) => {
          expandedVisitors[key] = { enter: visitor };
        });
      } else if (typeof visitor == 'object') {
        keys.forEach((key) => {
          expandedVisitors[key] = {
            enter: visitor.enter,
            leave: visitor.leave
          }
        });
      }
    });

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
    const visitorCtx: VisitorContext = {
      stopped: false,
      stop() {
        this.stopped = true;
      }
    };

    new Traverser(
      data.expand ? this.expandVisitors(data.visitors) : data.visitors
    ).visitPath(
      visitorCtx,
      NodePath.for({
        node: data.node,
        key: null,
        listKey: null,
        parentPath: data.parentPath,
        ctx: data.ctx
      }),
      data.state,
      new WeakSet(),
      data.onlyChildren
    );
  }
}

export const traverse = <NodeT, StateT>(
  node: NodeT,
  visitors: Visitors<StateT> & { $?: TraverseOptions },
  state?: StateT
) => {
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
