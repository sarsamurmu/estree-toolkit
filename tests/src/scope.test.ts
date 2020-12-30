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
    }
  });

  expect.assertions(2);
});

describe('binding registration from variable declaration', () => {
  test('normal', () => {
    const ast = parseModule(`
      const { a, b: [c, { d }], e: f = 0, ...g } = x;
    `);

    traverse(ast, {
      Program(path) {
        const bindingNames = Object.keys(path.scope.bindings);
        expect(bindingNames).toHaveLength(5);
        expect(bindingNames).toEqual(expect.arrayContaining(['a', 'c', 'd', 'f', 'g']));
      }
    });

    expect.assertions(2);
  });

  test('in `for..in` and `for..of` statement', () => {
    const ast = parseModule(`
      for (const { a, b: [c, { d }], e: f = 0, ...g } in x);
      for (const { a, b: [c, { d }], e: f = 0, ...g } of x);
    `);

    traverse(ast, {
      ForInStatement(path) {
        const bindingNames = Object.keys(path.scope.bindings);
        expect(bindingNames).toHaveLength(5);
        expect(bindingNames).toEqual(expect.arrayContaining(['a', 'c', 'd', 'f', 'g']));
      },
      ForOfStatement(path) {
        const bindingNames = Object.keys(path.scope.bindings);
        expect(bindingNames).toHaveLength(5);
        expect(bindingNames).toEqual(expect.arrayContaining(['a', 'c', 'd', 'f', 'g']));
      }
    });

    expect.assertions(2 * 2);
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

  test('in `for..in` and `for..of` statement', () => {
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
