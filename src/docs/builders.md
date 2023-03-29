---
title: Builders
---

It contains functions for building AST nodes

```js
const { builders: b } = require('estree-toolkit');

// `b` is our builders object
```

-----------------------------------

## Usage
```js
// Suppose we want to build an Identifier node with name `a`
// then we would build it like this
b.identifier('a') // => { type: 'Identifier', name: 'a' }

// Literal with value 100
b.literal(100) // => { type: 'Literal', value: 100 }

// If we wanted to build AST of this code - `(a,b) => [a+b, a-b]`
b.arrowFunctionExpression(
  // Params
  [b.identifier('a'), b.identifier('b')],
  // Body
  b.arrayExpression([
    b.binaryExpression('+', b.identifier('a'), b.identifier('b')),
    b.binaryExpression('-', b.identifier('a'), b.identifier('b'))
  ])
)

// There's more, if you're using VSCode,
// the autocomplete will help you
// You can also check this file for all kind of builders
// - https://github.com/sarsamurmu/estree-toolkit/blob/main/src/generated/builders-type.ts
```

--------------------------------------

## Mistakes
The mistake that can happen is that we try to reuse code, so we also try to
reuse the built nodes. Reusing the nodes can cause bugs in the code, and your
program could behave in an unexpected way. Internally the object reference of any
node is used as the node's ID. But when you reuse nodes, `estree-toolkit` mistakes
two nodes as same and causes unexpected behavior.

You can always use
[`structuredClone()`](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone)
to clone a node and use the cloned node.

```js
// This node represents `a.b.c`
const main = b.memberExpression(
  b.memberExpression(
    b.identifier('a'),
    b.identifier('b')
  ),
  b.identifier('c')
)

// Suppose we also need `a.b.c.x` and `a.b.c.y`

// For `a.b.c.x`
const xMem = b.memberExpression(main, b.identifier('x'))
// For `a.b.c.y`
const yMem = b.memberExpression(main, b.identifier('y'))

// The way we built `xMem` and `yMem` is not correct,
// we can't reference the same node object (here `main`)
// multiple times

// Here is the correct way to do it
// For `a.b.c.x`
const xMem = b.memberExpression(structuredClone(main), b.identifier('x'))
// For `a.b.c.y`
const yMem = b.memberExpression(structuredClone(main), b.identifier('y'))
```
