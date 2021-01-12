/* istanbul ignore file */

import { Node, BaseNode } from 'estree';

type NodeKeys<N> = Exclude<keyof N, keyof BaseNode>;

export type DefinitionIndex<T> = T extends true
  ? number | [builderIndex: number | false, visitIndex: number | false]
  : false | [builderIndex: number | false, visitIndex: false];

export type DefinitionField<N, V> = {
  validate?: (value: V) => boolean; // Make it required
  default?: V | ((node: N) => V);
  type?: string;
};

export type Definition<N extends Node = Node> = {
  indices: {
    [K in NodeKeys<N>]: DefinitionIndex<N[K] extends Node | (Node | null)[] | undefined | null ? true : false>;
  };
  fields: {
    [F in NodeKeys<N>]: DefinitionField<N, N[F]>;
  };
};

export type Definitions = {
  [N in Node as `${N['type']}`]: Definition<N>;
}

/** Creates a clean object without any prototype */
const clean = <T>(obj: T): T => Object.assign(Object.create(null), obj);

export const definitions: Definitions = clean<Definitions>({
  Identifier: {
    indices: {
      name: [0, false]
    },
    fields: {
      name: {}
    }
  },
  Literal: {
    indices: {
      value: [0, false],
      raw: false
    },
    fields: {
      value: {},
      raw: {}
    }
  },
  Program: {
    indices: {
      body: 0,
      sourceType: [1, false],
      comments: [2, false]
    },
    fields: {
      body: {},
      sourceType: { default: 'module' },
      comments: { default: [] }
    }
  },
  FunctionDeclaration: {
    indices: {
      id: 0,
      params: 1,
      body: 2,
      generator: [3, false],
      async: [4, false]
    },
    fields: {
      id: {},
      params: {},
      body: {},
      generator: { default: false },
      async: { default: false }
    }
  },
  FunctionExpression: {
    indices: {
      id: 0,
      params: 1,
      body: 2,
      generator: [3, false],
      async: [4, false]
    },
    fields: {
      id: {},
      params: {},
      body: {},
      generator: { default: false },
      async: { default: false }
    }
  },
  ArrowFunctionExpression: {
    indices: {
      params: 0,
      body: 1,
      expression: [2, false],
      async: [3, false],
      generator: false
    },
    fields: {
      params: {},
      body: {},
      expression: { default: false },
      async: { default: false },
      generator: {}
    }
  },
  SwitchCase: {
    indices: {
      test: 0,
      consequent: 1
    },
    fields: {
      test: {},
      consequent: {}
    }
  },
  CatchClause: {
    indices: {
      param: 0,
      body: 1
    },
    fields: {
      param: {},
      body: {}
    }
  },
  VariableDeclarator: {
    indices: {
      id: 0,
      init: 1
    },
    fields: {
      id: {},
      init: { default: null }
    }
  },
  ExpressionStatement: {
    indices: {
      expression: 0
    },
    fields: {
      expression: {}
    }
  },
  BlockStatement: {
    indices: {
      body: 0,
      innerComments: false
    },
    fields: {
      body: {},
      innerComments: {}
    }
  },
  EmptyStatement: {
    indices: {},
    fields: {}
  },
  DebuggerStatement: {
    indices: {},
    fields: {}
  },
  WithStatement: {
    indices: {
      object: 0,
      body: 1
    },
    fields: {
      object: {},
      body: {}
    }
  },
  ReturnStatement: {
    indices: {
      argument: 0
    },
    fields: {
      argument: { default: null }
    }
  },
  LabeledStatement: {
    indices: {
      label: 0,
      body: 1
    },
    fields: {
      label: {},
      body: {}
    }
  },
  BreakStatement: {
    indices: {
      label: 0
    },
    fields: {
      label: { default: null }
    }
  },
  ContinueStatement: {
    indices: {
      label: 0
    },
    fields: {
      label: { default: null }
    }
  },
  IfStatement: {
    indices: {
      test: 0,
      consequent: 1,
      alternate: 2
    },
    fields: {
      test: {},
      consequent: {},
      alternate: { default: null }
    }
  },
  SwitchStatement: {
    indices: {
      discriminant: 0,
      cases: 1
    },
    fields: {
      discriminant: {},
      cases: {}
    }
  },
  ThrowStatement: {
    indices: {
      argument: 0
    },
    fields: {
      argument: {}
    }
  },
  TryStatement: {
    indices: {
      block: 0,
      handler: 1,
      finalizer: 2
    },
    fields: {
      block: {},
      handler: {},
      finalizer: { default: null }
    }
  },
  WhileStatement: {
    indices: {
      test: 0,
      body: 1
    },
    fields: {
      test: {},
      body: {}
    }
  },
  DoWhileStatement: {
    indices: {
      test: 0,
      body: 1
    },
    fields: {
      test: {},
      body: {}
    }
  },
  ForStatement: {
    indices: {
      init: 0,
      test: 1,
      update: 2,
      body: 3
    },
    fields: {
      init: {},
      test: {},
      update: {},
      body: {}
    }
  },
  ForInStatement: {
    indices: {
      left: 0,
      right: 1,
      body: 2
    },
    fields: {
      left: {},
      right: {},
      body: {}
    }
  },
  ForOfStatement: {
    indices: {
      left: 0,
      right: 1,
      body: 2,
      await: [3, false]
    },
    fields: {
      left: {},
      right: {},
      body: {},
      await: {}
    }
  },
  VariableDeclaration: {
    indices: {
      kind: [0, false],
      declarations: 1
    },
    fields: {
      kind: {},
      declarations: {}
    }
  },
  ClassDeclaration: {
    indices: {
      id: 0,
      body: 2,
      superClass: [3, 1]
    },
    fields: {
      id: {},
      body: {},
      superClass: { default: null }
    }
  },
  ThisExpression: {
    indices: {},
    fields: {}
  },
  ArrayExpression: {
    indices: {
      elements: 0
    },
    fields: {
      elements: {}
    }
  },
  ObjectExpression: {
    indices: {
      properties: 0
    },
    fields: {
      properties: {}
    }
  },
  YieldExpression: {
    indices: {
      argument: 0,
      delegate: [1, false]
    },
    fields: {
      argument: {},
      delegate: { default: false }
    }
  },
  UnaryExpression: {
    indices: {
      operator: [0, false],
      argument: 1,
      prefix: [2, false]
    },
    fields: {
      operator: {},
      argument: {},
      prefix: { default: true }
    }
  },
  UpdateExpression: {
    indices: {
      operator: [0, false],
      argument: 1,
      prefix: [2, false]
    },
    fields: {
      operator: {},
      argument: {},
      prefix: {}
    }
  },
  BinaryExpression: {
    indices: {
      operator: [0, false],
      left: 1,
      right: 2
    },
    fields: {
      operator: {},
      left: {},
      right: {}
    }
  },
  AssignmentExpression: {
    indices: {
      operator: [0, false],
      left: 1,
      right: 2
    },
    fields: {
      operator: {},
      left: {},
      right: {}
    }
  },
  LogicalExpression: {
    indices: {
      operator: [0, false],
      left: 1,
      right: 2
    },
    fields: {
      operator: {},
      left: {},
      right: {}
    }
  },
  MemberExpression: {
    indices: {
      object: 0,
      property: 1,
      computed: [2, false],
      optional: [3, false]
    },
    fields: {
      object: {},
      property: {},
      computed: { default: false },
      optional: { default: false }
    }
  },
  ConditionalExpression: {
    indices: {
      test: 0,
      consequent: 1,
      alternate: 2
    },
    fields: {
      test: {},
      consequent: {},
      alternate: {}
    }
  },
  CallExpression: {
    indices: {
      callee: 0,
      arguments: 1,
      optional: [2, false]
    },
    fields: {
      callee: {},
      arguments: {},
      optional: { type: 'boolean', default: false }
    }
  },
  NewExpression: {
    indices: {
      callee: 0,
      arguments: 1
    },
    fields: {
      callee: {},
      arguments: {}
    }
  },
  SequenceExpression: {
    indices: {
      expressions: 0
    },
    fields: {
      expressions: {}
    }
  },
  TemplateLiteral: {
    indices: {
      quasis: 0,
      expressions: 1
    },
    fields: {
      quasis: {},
      expressions: {}
    }
  },
  TaggedTemplateExpression: {
    indices: {
      tag: 0,
      quasi: 1
    },
    fields: {
      tag: {},
      quasi: {}
    }
  },
  ClassExpression: {
    indices: {
      id: 0,
      body: 2,
      superClass: [3, 1]
    },
    fields: {
      id: {},
      body: {},
      superClass: { default: null }
    }
  },
  MetaProperty: {
    indices: {
      meta: 0,
      property: 1
    },
    fields: {
      meta: {},
      property: {}
    }
  },
  AwaitExpression: {
    indices: {
      argument: 0
    },
    fields: {
      argument: {}
    }
  },
  ImportExpression: {
    indices: {
      source: 0
    },
    fields: {
      source: {}
    }
  },
  ChainExpression: {
    indices: {
      expression: 0
    },
    fields: {
      expression: {}
    }
  },
  Property: {
    indices: {
      kind: [0, false],
      key: 1,
      value: 2,
      computed: [3, false],
      shorthand: [4, false],
      method: false
    },
    fields: {
      kind: {},
      key: {},
      value: {},
      computed: { default: false },
      shorthand: { default: false },
      method: {}
    }
  },
  Super: {
    indices: {},
    fields: {}
  },
  TemplateElement: {
    indices: {
      value: [0, false],
      tail: [1, false]
    },
    fields: {
      value: {},
      tail: {}
    }
  },
  SpreadElement: {
    indices: {
      argument: 0
    },
    fields: {
      argument: {}
    }
  },
  ObjectPattern: {
    indices: {
      properties: 0
    },
    fields: {
      properties: {}
    }
  },
  ArrayPattern: {
    indices: {
      elements: 0
    },
    fields: {
      elements: {}
    }
  },
  RestElement: {
    indices: {
      argument: 0
    },
    fields: {
      argument: {}
    }
  },
  AssignmentPattern: {
    indices: {
      left: 0,
      right: 1
    },
    fields: {
      left: {},
      right: {}
    }
  },
  ClassBody: {
    indices: {
      body: 0
    },
    fields: {
      body: {}
    }
  },
  MethodDefinition: {
    indices: {
      kind: [0, false],
      key: 1,
      value: 2,
      computed: [3, false],
      static: [4, false]
    },
    fields: {
      kind: {},
      key: {},
      value: {},
      computed: { default: false },
      static: { default: false }
    }
  },
  ImportDeclaration: {
    indices: {
      specifiers: 0,
      source: 1
    },
    fields: {
      specifiers: {},
      source: {}
    }
  },
  ExportNamedDeclaration: {
    indices: {
      declaration: 0,
      specifiers: 1,
      source: 2
    },
    fields: {
      declaration: {},
      specifiers: { default: [] },
      source: { default: null }
    }
  },
  ExportDefaultDeclaration: {
    indices: {
      declaration: 0
    },
    fields: {
      declaration: {}
    }
  },
  ExportAllDeclaration: {
    indices: {
      source: 0
    },
    fields: {
      source: {}
    }
  },
  ImportSpecifier: {
    indices: {
      imported: 0,
      local: 1
    },
    fields: {
      imported: {},
      local: {
        default: (node) => ({ type: 'Identifier', name: node.imported.name })
      }
    }
  },
  ImportDefaultSpecifier: {
    indices: {
      local: 0
    },
    fields: {
      local: {}
    }
  },
  ImportNamespaceSpecifier: {
    indices: {
      local: 0
    },
    fields: {
      local: {}
    }
  },
  ExportSpecifier: {
    indices: {
      local: 0,
      exported: 1
    },
    fields: {
      local: {},
      exported: {
        default: (node) => ({ type: 'Identifier', name: node.local.name })
      }
    }
  }
});

export const getFieldsOf = ({ indices }: Definition, type: 'builder' | 'visitor'): string[] => {
  const fields: { name: string, index: number }[] = [];

  Object.keys(indices).forEach((fieldName) => {
    const indexValue: DefinitionIndex<true | false> = (indices as any)[fieldName];
    if (indexValue === false) return;
    switch (typeof indexValue) {
      case 'number':
        return fields.push({ name: fieldName, index: indexValue });
      case 'object': {
        const index = indexValue[type === 'builder' ? 0 : 1];
        if (index === false) return;
        return fields.push({ name: fieldName, index: index });
      }
    }
  });

  return fields.sort((a, b) => a.index - b.index).map(({ name }) => name);
}

export const visitorKeys = (() => {
  const record: Record<string, readonly string[] | undefined> = Object.create(null);

  for (const nodeType in definitions) {
    record[nodeType] = getFieldsOf((definitions as Record<string, Definition>)[nodeType], 'visitor');
  }

  return record as Readonly<typeof record>;
})();

export type AliasMap = {
  Function: import('estree').Function;
  Statement: import('estree').Statement
  Declaration: import('estree').Declaration;
  Expression: import('estree').Expression;
  Pattern: import('estree').Pattern;
  Class: import('estree').Class;
}

export const aliases: {
  [K in keyof AliasMap]: {
    [X in AliasMap[K]['type']]: 0;
  }
} = clean({
  Function: clean({
    FunctionDeclaration: 0,
    FunctionExpression: 0,
    ArrowFunctionExpression: 0
  }),
  Statement: clean({
    FunctionDeclaration: 0,
    ExpressionStatement: 0,
    BlockStatement: 0,
    EmptyStatement: 0,
    DebuggerStatement: 0,
    WithStatement: 0,
    ReturnStatement: 0,
    LabeledStatement: 0,
    BreakStatement: 0,
    ContinueStatement: 0,
    IfStatement: 0,
    SwitchStatement: 0,
    ThrowStatement: 0,
    TryStatement: 0,
    WhileStatement: 0,
    DoWhileStatement: 0,
    ForStatement: 0,
    ForInStatement: 0,
    ForOfStatement: 0,
    VariableDeclaration: 0,
    ClassDeclaration: 0
  }),
  Declaration: clean({
    FunctionDeclaration: 0,
    VariableDeclaration: 0,
    ClassDeclaration: 0
  }),
  Expression: clean({
    FunctionExpression: 0,
    ArrowFunctionExpression: 0,
    ClassExpression: 0,
    CallExpression: 0,
    ConditionalExpression: 0,
    ChainExpression: 0,
    Identifier: 0,
    Literal: 0,
    ThisExpression: 0,
    ArrayExpression: 0,
    ObjectExpression: 0,
    YieldExpression: 0,
    UnaryExpression: 0,
    UpdateExpression: 0,
    BinaryExpression: 0,
    AssignmentExpression: 0,
    LogicalExpression: 0,
    MemberExpression: 0,
    NewExpression: 0,
    SequenceExpression: 0,
    TemplateLiteral: 0,
    TaggedTemplateExpression: 0,
    MetaProperty: 0,
    AwaitExpression: 0,
    ImportExpression: 0
  }),
  Pattern: clean({
    Identifier: 0,
    MemberExpression: 0,
    ObjectPattern: 0,
    ArrayPattern: 0,
    RestElement: 0,
    AssignmentPattern: 0
  }),
  Class: clean({
    ClassDeclaration: 0,
    ClassExpression: 0
  })
});
