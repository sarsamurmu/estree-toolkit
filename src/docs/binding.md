---
title: Binding
---

`Binding` contains information about bindings (declared variables).

```js
const { traverse } = require('estree-toolkit');
const { parseModule } = require('meriyah');

const ast = parseModule(`
const a = 10;
let b = 20;
const [c, d] = [30, 40];
`);

traverse(ast, {
  $: { scope: true },
  Program(path) {
    path.scope.bindings
    /* => 
      {
        a: Binding { ... },
        b: Binding { ... },
        c: Binding { ... },
        d: Binding { ... }
      }
    */
  }
});
```

-----------------------------------------

## Properties

### `kind`
- Type: `string`

The way the binding has been declared. Can be any one of these - `var`, `let`, `const`, `param`, `hoisted`, `local`, `module`.

```js var
var x = 0;
// Kind of `x` is 'var'
```
```js const
const x = 0;
// Kind of `x` is 'const'
```
```js let
let x = 0;
// Kind of `x` is 'let'

try {} catch (x) {
  // Kind of `x` is 'let'
}
```
```js param
function a(x) {
  // Kind of `x` is 'param'
}

(function (x) {
  // Kind of `x` is 'param'
});

((x) => {
  // Kind of `x` is 'param'
});
```
```js hoisted
function x() {}
// Kind of `x` is 'hoisted'

class x() { constructor() {} }
// Kind of `x` is 'hoisted'
```
```js local
addEventListener(function x() {
  // Kind of `x` is 'local'
});

submitClass(class x() {
  // Kind of `x` is 'local'
})

// Kind 'local' only appears in FunctionExpression and ClassExpression
```
```js module
import { x, a as y } from 'mod';
// Kind of `x` and `y` is 'module'

import x from 'mod';
// Kind of `x` is 'module'

import * as x from 'mod';
// Kind of `x` is 'module'
```

### `name`
- Type: `string`

The name of the binding.

### `scope`
- Type: [`Scope`](/scope)

The scope that contains the binding.

### `identifierPath`
- Type: `NodePath`

The binding's identifier's path.

```js
// Take this as an example

 function Func() {}
//        ─┬──
//         │
//         └── This would be the binding's `identifierPath`

// In the binding generated for the above function,
// the binding's `identifierPath` would be the path to `Func`
// identifier
```

### `path`
- Type: `NodePath`

The whole path for the binding.

```js
// Take this as an example

   function Func() {}
// ──┬───────────────
//   │
//   └── This would be the binding's `path`

// In the binding generated for the above function,
// the binding's `path` would be the path to the whole function
```

### `references`
- Type: `NodePath[]`

All paths that references this binding.

### `constantViolations`
- Type: `NodePaths[]`

All paths that reassigns the value of this binding.

```js
const x = 0;

// This is a constant violation
x = 0;

const y = { a: 0 };

// This is a constant violation
y = { b: 0 }

// This is not a constant violation
y.c = 0;
```

### `constant`
- Type: `boolean`

If the binding is constant. A binding is constant when it has no
constant violations.
