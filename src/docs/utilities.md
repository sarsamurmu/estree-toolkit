---
title: Utilities
---

These are basic utilities that you can use as helper functions

```js
import { utils as u } from 'estree-toolkit';
```

-------------------------------

## `evaluate(path)`
- `path`: <`NodePath`> The path that you want to evaluate
- Returns: `{ value: any } | undefined` The evaluation result

Evaluates the given path and returns the evaluated result. If it's sure
about the evaluation it would return an object with the evaluated value stored
in `value` property. If it's not sure about the evaluation it would return `undefined`.

For now it only supports logical, binary and unary operations.
These AST Nodes are supported for now
- `Identifier` - with `undefined` as value
- `Literal`
- `BinaryExpression` - except `instanceof` operator
- `UnaryExpression` - except `delete` operator
- `LogicalExpression`
- `ObjectExpression`
- `ArrayExpression`

```js
import { utils as u, traverse } from 'estree-toolkit';
import { parseModule } from 'meriyah';

traverse(parseModule(`undefined`), {
  Identifier(path) {
    u.evaluate(path) // => { value: undefined }
  }
});

traverse(parseModule(`'some string'`), {
  Literal(path) {
    u.evaluate(path) // => { value: 'some string' }
  }
});

traverse(parseModule(`1 + 2`), {
  BinaryExpression(path) {
    u.evaluate(path) // => { value: 3 }
  }
});

traverse(parseModule(`!(1 === 2)`), {
  UnaryExpression(path) {
    u.evaluate(path) // => { value: true }
  }
});

traverse(parseModule(`false && unknown`), {
  LogicalExpression(path) {
    u.evaluate(path) // => { value: false }
  }
});

traverse(parseModule(`
  ({ a: 1, b: 2, m: { c: 1 } })
`), {
  ObjectExpression(path) {
    if (path.parent.type !== 'ExpressionStatement') return;

    u.evaluate(path) // => { a: 1, b: 2, m: { c: 1 } }
  }
});

traverse(parseModule(`[1, 2, '3']`), {
  ArrayExpression(path) {
    u.evaluate(path) // => [1, 2, '3']
  }
});

// Whenever unknown binding is involved, it returns `undefined`

traverse(parseModule(`unknownVariable`), {
  Identifier(path) {
    u.evaluate(path) // => undefined
  }
});

traverse(parseModule(`unknownVariable === 55`), {
  BinaryExpression(path) {
    u.evaluate(path) // => undefined
  }
});
```

-------------------------------------

## `evaluateTruthy(path)`
- `path`: <`NodePath`> The path that you want to evaluate
- Returns: `true | false | undefined` The evaluation result

It's just like `evaluate(path)` but it evaluates for truthiness. It returns `true` or `false`
depending on the evaluation result, if it's sure. If it's not sure, it would return `undefined`.

```js
import { utils as u, traverse } from 'estree-toolkit';
import { parseModule } from 'meriyah';

traverse(parseModule(`false && unknown`), {
  LogicalExpression(path) {
    u.evaluateTruthy(path) // => false
  }
});

traverse(parseModule(`true || unknown`), {
  LogicalExpression(path) {
    u.evaluateTruthy(path) // => true
  }
});

traverse(parseModule(`!0`), {
  UnaryExpression(path) {
    u.evaluateTruthy(path) // => true
  }
});
```

---------------------------------------

## `hasBinding(path, name)`
- `path`: <`NodePath`> The path from where the searching should start
- `name`: <`string`> The name of the binding
- Returns: `boolean` If the binding is available in the current position

You can easily track scopes by enabling [`Scope`](./scope) when [traversing](./traversal#options).
But if you need to check if a binding is available only one or two times, using `Scope` can decrease
performance, because scope builds all graphs that you may not need. So using `hasBinding` is that
case would be more preferable.

This function starts walking up the tree from the `path` and finds if there is any binding
with the provided name. If there is any binding it returns `true`, if not then it returns `false`.

```js
import { utils as u, traverse } from 'estree-toolkit';
import { parseModule } from 'meriyah';

const ast = parseModule(`
  {
    let a;
    {
      id1;
    }
  }

  id2;
`);

traverse(ast, {
  Identifier(path) {
    if (path.node.name === 'id1') {
      u.hasBinding(path, 'a') // => true
    } else if (path.node.name === 'id2') {
      u.hasBinding(path, 'a') // => false
    }
  }
});
```
