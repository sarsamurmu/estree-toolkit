import { parseModule } from 'meriyah';

import { traverse } from '<project>';

test('reference collection', () => {
  const source = `
    // ----------------------------
    //      identifierCrawlers
    // ----------------------------
    (() => ArrowFunctionExpression_body);
    x = AssignmentExpression_right;
    ((x = AssignmentPattern_right) => 0);
    async () => { await AwaitExpression_argument }
    switch (x) { case SwitchCase_test: break; }
    let x = VariableDeclarator_init;
    ExpressionStatement_expression;
    () => { return ReturnStatement_argument };
    if (IfStatement_test);
    switch (SwitchStatement_discriminant) {}
    throw ThrowStatement_argument;
    while (WhileStatement_test);
    do {} while (DoWhileStatement_test);
    for (ForStatement_init; ForStatement_test; ForStatement_update);
    for (x in ForInStatement_right);
    for (x of ForOfStatement_right);
    class x extends ClassDeclaration_superClass {}
    (function *() { yield YieldExpression_argument });
    !UnaryExpression_argument;
    BinaryExpression_left + BinaryExpression_right;
    LogicalExpression_left || LogicalExpression_right;
    MemberExpression_object.x;
    ConditionalExpression_test ? ConditionalExpression_consequent : ConditionalExpression_alternate;
    CallExpression_callee();
    new NewExpression_callee();
    TaggedTemplateExpression_tag\`\`;
    (class extends ClassExpression_superClass {});
    import.meta;
    import(ImportExpression_source);
    ({ [Property_key]: Property_value, x: x });
    [...SpreadElement_argument];
    class x { fn() {} }
    export default ExportDefaultDeclaration_declaration;
    export { ExportSpecifier_local as x }

    // ----------------------------
    //   inListIdentifierCrawlers
    // ----------------------------
    [ArrayExpression_elements];
    x(CallExpression_arguments);
    new x(NewExpression_arguments);
    (SequenceExpression_expressions, x);
    \`\${TemplateLiteral_expressions}\`;
  `;
  const ast = parseModule(source);
  const referencedIdentifiers = [...source.matchAll(/\b([A-Z][a-z]+)+_[A-Za-z]+\b/gm)].map((m) => m[0]);

  traverse(ast, {
    Program(path) {
      const bindingNames = Object.keys(path.scope.globalBindings);
      expect(bindingNames).toEqual(expect.arrayContaining(referencedIdentifiers));
      expect(bindingNames).not.toEqual(expect.arrayContaining(['import']));
      expect(
        Object.values(path.scope.globalBindings).map((b) => b.kind)
      ).toEqual(Array(bindingNames.length).fill('global'));
    }
  });

  expect.assertions(3);
});

describe('label', () => {
  describe('registration', () => {
    test('for..in and for..of statement', () => {
      const ast = parseModule(`
        forOf: for (i of x);
        forIn: for (i in x);
      `);

      traverse(ast, {
        ForOfStatement(path) {
          expect(path.scope.labels.forOf).toBeTruthy();
          expect(path.scope.labels.forIn).toBe(undefined);
        },
        ForInStatement(path) {
          expect(path.scope.labels.forIn).toBeTruthy();
          expect(path.scope.labels.forOf).toBe(undefined);
        }
      });

      expect.assertions(2 * 2);
    });

    test('block statement', () => {
      const ast = parseModule(`
        blockLabel: {
          undefined
        }
      `);

      traverse(ast, {
        BlockStatement(path) {
          expect(path.scope.labels.blockLabel).toBeTruthy();
        }
      });

      expect.assertions(1);
    });
  });

  test('reference', () => {
    const ast = parseModule(`
      block: {
        break block;
      }
      forS: for (;;) {
        break forS;
        continue forS;
      }
      forOf: for (x of o) {
        break forOf;
        continue forOf;
      }
      forIn: for (x in o) {
        break forIn;
        continue forIn;
      }
    `);

    traverse(ast, {
      BlockStatement(path) {
        if (path.parent.type !== 'LabeledStatement') return;
        const { references } = path.scope.labels.block;
        expect(references).toHaveLength(1);
        expect(references[0].parent.type).toBe('BreakStatement');
      },
      ForStatement(path) {
        const { references } = path.scope.labels.forS;
        expect(references).toHaveLength(2);
        expect(references.map((ref) => ref.parent.type)).toEqual(['BreakStatement', 'ContinueStatement']);
      },
      ForOfStatement(path) {
        const { references } = path.scope.labels.forOf;
        expect(references).toHaveLength(2);
        expect(references.map((ref) => ref.parent.type)).toEqual(['BreakStatement', 'ContinueStatement']);
      },
      ForInStatement(path) {
        const { references } = path.scope.labels.forIn;
        expect(references).toHaveLength(2);
        expect(references.map((ref) => ref.parent.type)).toEqual(['BreakStatement', 'ContinueStatement']);
      }
    });

    expect.assertions(4 * 2);
  });
});

describe('binding registration', () => {
  test('from variable declaration', () => {
    const ast = parseModule(`
      const { a, b: [c, { d }], e: f = 0, ...g } = x;
    `);

    traverse(ast, {
      Program(path) {
        const bindingNames = Object.keys(path.scope.bindings);
        expect(bindingNames).toHaveLength(5);
        expect(bindingNames).toEqual(expect.arrayContaining(['a', 'c', 'd', 'f', 'g']));
        expect(Object.values(path.scope.bindings).map((b) => b.kind)).toEqual(Array(5).fill('const'));
      }
    });

    expect.assertions(3);
  });

  test('from ImportSpecifier', () => {
    const ast = parseModule(`
      import { a as b } from '';
    `);

    traverse(ast, {
      Program(path) {
        const { a: aBinding, b: bBinding } = path.scope.bindings;
        expect(aBinding).toBeUndefined();
        expect(bBinding.kind).toBe('module');
        expect(bBinding.identifierPath.type).toBe('Identifier');
        expect(bBinding.identifierPath.node.name).toBe('b');
        expect(bBinding.path.type).toBe('ImportSpecifier');
      }
    });

    expect.assertions(5);
  });

  test('from ImportDefaultSpecifier', () => {
    const ast = parseModule(`
      import a from '';
    `);

    traverse(ast, {
      Program(path) {
        const binding = path.scope.bindings.a;
        expect(binding.kind).toBe('module');
        expect(binding.identifierPath.type).toBe('Identifier');
        expect(binding.identifierPath.node.name).toBe('a');
        expect(binding.path.type).toBe('ImportDefaultSpecifier');
      }
    });

    expect.assertions(4);
  });

  test('from ImportNamespaceSpecifier', () => {
    const ast = parseModule(`
      import * as a from '';
    `);

    traverse(ast, {
      Program(path) {
        const binding = path.scope.bindings.a;
        expect(binding.kind).toBe('module');
        expect(binding.identifierPath.type).toBe('Identifier');
        expect(binding.identifierPath.node.name).toBe('a');
        expect(binding.path.type).toBe('ImportNamespaceSpecifier');
      }
    });

    expect.assertions(4);
  });

  test('from for, for..in and for..of statement', () => {
    const ast = parseModule(`
      for (var { a, b: [c, { d }], e: f = 0, ...g } = x;;);
      for (let { h, i: [j, { k }], l: m = 0, ...n } in x);
      for (const { o, p: [q, { r }], s: t = 0, ...u } of x);
    `);

    traverse(ast, {
      ForStatement(path) {
        const bindingNames = Object.keys(path.scope.bindings);
        expect(bindingNames).toHaveLength(5);
        expect(bindingNames).toEqual(expect.arrayContaining(['a', 'c', 'd', 'f', 'g']));
        expect(
          Object.values(path.scope.bindings).map((b) => b.kind)
        ).toEqual(Array(bindingNames.length).fill('var'));
      },
      ForInStatement(path) {
        const bindingNames = Object.keys(path.scope.bindings);
        expect(bindingNames).toHaveLength(5);
        expect(bindingNames).toEqual(expect.arrayContaining(['h', 'j', 'k', 'm', 'n']));
        expect(
          Object.values(path.scope.bindings).map((b) => b.kind)
        ).toEqual(Array(bindingNames.length).fill('let'));
      },
      ForOfStatement(path) {
        const bindingNames = Object.keys(path.scope.bindings);
        expect(bindingNames).toHaveLength(5);
        expect(bindingNames).toEqual(expect.arrayContaining(['o', 'q', 'r', 't', 'u']));
        expect(
          Object.values(path.scope.bindings).map((b) => b.kind)
        ).toEqual(Array(bindingNames.length).fill('const'));
      }
    });

    expect.assertions(3 * 3);
  });

  test('from FunctionDeclaration', () => {
    const ast = parseModule(`
      {
        function fnDec() {}
      }
    `);

    traverse(ast, {
      BlockStatement(path) {
        if (path.parent.type !== 'Program') return;
        const fnBinding = path.scope.bindings.fnDec;
        expect(fnBinding.kind).toBe('hoisted');
        expect(fnBinding.identifierPath.type).toBe('Identifier');
        expect(fnBinding.identifierPath.node.name).toBe('fnDec');
        expect(fnBinding.path.type).toBe('FunctionDeclaration');
      }
    });

    expect.assertions(4);
  });

  test('from ClassDeclaration', () => {
    const ast = parseModule(`
      {
        class classDec {}
      }
    `);

    traverse(ast, {
      BlockStatement(path) {
        if (path.parent.type !== 'Program') return;
        const classBinding = path.scope.bindings.classDec;
        expect(classBinding.kind).toBe('hoisted');
        expect(classBinding.identifierPath.type).toBe('Identifier');
        expect(classBinding.identifierPath.node.name).toBe('classDec');
        expect(classBinding.path.type).toBe('ClassDeclaration');
      }
    });

    expect.assertions(4);
  });

  test('from FunctionExpression', () => {
    const ast = parseModule(`
      (function fnExp() {})
    `);

    traverse(ast, {
      Program(path) {
        const fnBinding = path.scope.bindings.fnExp;
        expect(fnBinding).toBeUndefined();
      },
      FunctionExpression(path) {
        const fnBinding = path.scope.bindings.fnExp;
        expect(fnBinding.kind).toBe('local');
        expect(fnBinding.identifierPath.type).toBe('Identifier');
        expect(fnBinding.identifierPath.node.name).toBe('fnExp');
        expect(fnBinding.path.type).toBe('FunctionExpression');
      }
    });

    expect.assertions(5);
  });

  test('from ClassExpression', () => {
    const ast = parseModule(`
      (class classExp {})
    `);

    traverse(ast, {
      Program(path) {
        const classBinding = path.scope.bindings.fn;
        expect(classBinding).toBeUndefined();
      },
      ClassExpression(path) {
        const classBinding = path.scope.bindings.classExp;
        expect(classBinding.kind).toBe('local');
        expect(classBinding.identifierPath.type).toBe('Identifier');
        expect(classBinding.identifierPath.node.name).toBe('classExp');
        expect(classBinding.path.type).toBe('ClassExpression');
      }
    });

    expect.assertions(5);
  });

  test('from function parameters', () => {
    const ast = parseModule(`
      function fn({ a, b: c }, [d, e], f = 0, ...g) {}

      (function ({ h, i: j }, [k, l], m = 0, ...n) {})
    `);

    traverse(ast, {
      FunctionDeclaration(path) {
        const bindingNames = Object.keys(path.scope.bindings);
        expect(bindingNames).toHaveLength(6);
        expect(bindingNames).toEqual(expect.arrayContaining(['a', 'c', 'd', 'e', 'f', 'g']));
        expect(
          Object.values(path.scope.bindings).map((b) => b.kind)
        ).toEqual(Array(bindingNames.length).fill('param'));
      },
      FunctionExpression(path) {
        const bindingNames = Object.keys(path.scope.bindings);
        expect(bindingNames).toHaveLength(6);
        expect(bindingNames).toEqual(expect.arrayContaining(['h', 'j', 'k', 'l', 'm', 'n']));
        expect(
          Object.values(path.scope.bindings).map((b) => b.kind)
        ).toEqual(Array(bindingNames.length).fill('param'));
      }
    });

    expect.assertions(2 * 3);
  });

  test('from CatchClause', () => {
    const ast = parseModule(`
      try {} catch ({ message }) {}
    `);

    traverse(ast, {
      CatchClause(path) {
        const binding = path.scope.bindings.message;
        expect(binding.kind).toBe('let');
        expect(binding.identifierPath.type).toBe('Identifier');
        expect(binding.identifierPath.node.name).toBe('message');
        expect(binding.path.type).toBe('CatchClause');
      }
    });

    expect.assertions(4);
  });
});

describe('constant violations', () => {
  test('in AssignmentExpression and UpdateExpression', () => {
    const ast = parseModule(`
      ({ a, b: [c, { d }], e: f = 0, ...g } = x);
      h++;
    `);

    traverse(ast, {
      Program(path) {
        const { globalBindings } = path.scope;
        delete globalBindings.x;

        const bindingNames = Object.keys(globalBindings);
        expect(bindingNames).toHaveLength(6);
        expect(bindingNames).toEqual(expect.arrayContaining(['a', 'c', 'd', 'f', 'g', 'h']));

        for (const bindingName in globalBindings) {
          expect(globalBindings[bindingName].constantViolations).toHaveLength(1);
        }
      }
    });

    expect.assertions(2 + 6);
  });

  test('in for..in and for..of statement', () => {
    const ast = parseModule(`
      for ({ a, b: [c, { d }], e: f = 0, ...g } in x);
      for ({ a, b: [c, { d }], e: f = 0, ...g } of x);
    `);

    traverse(ast, {
      Program(path) {
        const { globalBindings } = path.scope;
        delete globalBindings.x;

        const bindingNames = Object.keys(globalBindings);
        expect(bindingNames).toHaveLength(5);
        expect(bindingNames).toEqual(expect.arrayContaining(['a', 'c', 'd', 'f', 'g']));

        for (const bindingName in globalBindings) {
          expect(globalBindings[bindingName].constantViolations).toHaveLength(2);
        }
      }
    });
  });
});
