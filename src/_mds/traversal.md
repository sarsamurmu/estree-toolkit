---
title: Traversal
---

You can traverse the AST using the `traverse` function

```js
const { traverse } = require('estree-toolkit');

traverse(ast, visitors, state);
```

As you can see `traverse` function takes three arguments - `ast`, `visitors`, `state`.
- *`ast`*: <`ESTree.Node`> You would pass the AST that you want to traverse. As you may have guessed,
  the AST has to be **ESTree** compliant.

- *`visitors`*: <[`Visitors`](#visitors)> An JavaScript object containing node type as
  its keys and a [visitor](#visitor) as its value. If you want same visitor for more than
  one node type then you have to separate them using `|` (pipe symbol).

- *`state`*: <`any`> This can be anything that can store state in it, preferably an JavaScript object. This
  would get passed to the visitor function, and the visitor function can modify it.

-----------------------------------------------------

## Visitors

Visitors is just a JavaScript object containing any node type as its key and [visitor](#visitor) as its value.

```js
// Base
const visitors = {
  <Node type>: <Visitor function for the node type>
}

// Eg.
const visitors = {
  Identifier() {},
  Literal() {},
  Program() {},
  // more visitors...
}
```

-----------------------------------------------------

### Visitor

Visitor can be a function or an object containing `enter` and `leave` function.

```js
// A single function
const visitors = {
  Identifier() { /* Gets called when the traverser enters an Identifier node */ }
}

// An object containing enter and leave functions
const visitors = {
  Identifier: {
    enter() { /* Gets called when the traverser enters an Identifier node */ },
    leave() { /* Gets called when the traverser leaves an Identifier node */ }
  }
}

// Basically this is
const visitors = {
  Identifier() { ... }
}
// same as -
const visitors = {
  Identifier: { enter() { ... } }
}
```

-----------------------------------------------------

### Visitor function

Visitor function is the function that gets called when the traverser *enters* or *leaves* a node

```js
const visitors = {
  // This is our visitor function
  Identifier(path, state) => {}
}

const visitors = {
  Identifier: {
    // `enter` and `leave` both are visitor function
    enter(path, state) {},
    leave(path, state) {}
  }
}
```

You would get two parameters in visitor function - `path` and `state`
- *`path`*: <[`NodePath`](/nodepath)> This would be a NodePath for the node that the traverser is currently
  traversing.

- *`state`*: <`any`> This would be the state that has been passed to the `traverse` function.
  See [this](#passing-states) for more information.

Also, if your function is bindable (not an arrow function), you would have access to the visitor
context using `this` keyword. Visitor context includes a special `stop` method, that you can
use to completely stop the traversal.

```js
const visitors = {
  Identifier(path, state) {
    this // <-- `this` is the visitor context
    this.stop() // would stop the traversal
  }
}
```

--------------------------------------------------

## Options

You can pass options to the traverse function, by attaching options object to `$` key
in the visitors object.

```js
const options = {
  scope: true,
  validateNodes: true
}

traverse(ast, {
  $: options, // <-- This is how you pass traverse options
  Literal() {},
  // ... and other visitors
});
```

For now, therese are the available options
- `scope`: <`boolean`> If scope tracking should be enabled.
  
- `validateNodes`: <`boolean`> If the new nodes should be validated, when new
  nodes are inserted into the AST. Generally, you wouldn't need it, but if your
  AST uses modified nodes then you may need to disable node validation.

--------------------------------------------------

## Examples

### Basic traversal

This is what you would need in most cases

```js Code
const ast = {
  type: 'ExpressionStatement',
  expression: {
    type: 'ArrayExpression',
    elements: [
      { type: 'Identifier', name: 'a' },
      { type: 'Identifier', name: 'b' },
      { type: 'Identifier', name: 'c' },
      { type: 'Identifier', name: 'd' }
    ]
  }
}

traverse(ast, {
  Identifier(path) {
    // `path` is the NodePath object of the currently traversing node
    console.log('Name is -', path.node.name);
  }
});
```
```txt Output
Name is - a
Name is - b
Name is - c
Name is - d
```

-----------------------------------------------------

### Sharing a visitor function between two node types

You can share a visitor with two or more node types using this shorthand syntax,
simply by separating them with `|`

::::Tabs
:::Tab[Code + Output]
```js
const ast = { /* Check AST tab */ }

traverse(ast, {
  'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression': (path) => {
    console.log(path.type + ':');
    path.node.params.forEach((param) => {
      if (param.type === 'Identifier') {
        console.log(param.name);
      }
    });
    console.log();
  }
});
```
```txt Output
FunctionDeclaration:
a
b
c

FunctionExpression:
e
f
g

ArrowFunctionExpression:
h
i
j
```
:::
:::Tab[AST input]
```js
function x(a, b, c) {} // => FunctionDeclaration

let y = function (e, f, g) {} // => FunctionExpression

let z = (h, i, j) => {} // => ArrowFunctionExpression
```
:::
:::Tab[AST]
```js
{
  type: 'Program',
  sourceType: 'script',
  body: [
    {
      type: 'FunctionDeclaration',
      id: {
        type: 'Identifier',
        name: 'x'
      },
      params: [
        {
          type: 'Identifier',
          name: 'a'
        },
        {
          type: 'Identifier',
          name: 'b'
        },
        {
          type: 'Identifier',
          name: 'c'
        }
      ],
      body: {
        type: 'BlockStatement',
        body: []
      },
      async: false,
      generator: false
    },
    {
      type: 'VariableDeclaration',
      kind: 'let',
      declarations: [
        {
          type: 'VariableDeclarator',
          id: {
            type: 'Identifier',
            name: 'y'
          },
          init: {
            type: 'FunctionExpression',
            id: null,
            params: [
              {
                type: 'Identifier',
                name: 'e'
              },
              {
                type: 'Identifier',
                name: 'f'
              },
              {
                type: 'Identifier',
                name: 'g'
              }
            ],
            body: {
              type: 'BlockStatement',
              body: []
            },
            async: false,
            generator: false
          }
        }
      ]
    },
    {
      type: 'VariableDeclaration',
      kind: 'let',
      declarations: [
        {
          type: 'VariableDeclarator',
          id: {
            type: 'Identifier',
            name: 'z'
          },
          init: {
            type: 'ArrowFunctionExpression',
            params: [
              {
                type: 'Identifier',
                name: 'h'
              },
              {
                type: 'Identifier',
                name: 'i'
              },
              {
                type: 'Identifier',
                name: 'j'
              }
            ],
            body: {
              type: 'BlockStatement',
              body: []
            },
            async: false,
            expression: false
          }
        }
      ]
    }
  ]
}
```
:::
::::

-----------------------------------------------------

### Passing states

You can use states for more abstract code. Using states you can increase reusability
of your code.

```js Code
const ast1 = {
  type: 'ExpressionStatement',
  expression: {
    type: 'ArrayExpression',
    elements: [
      { type: 'Identifier', name: 'a' },
      { type: 'Identifier', name: 'b' },
      { type: 'Identifier', name: 'c' },
      { type: 'Identifier', name: 'd' }
    ]
  }
}

const ast2 = {
  type: 'ExpressionStatement',
  expression: {
    type: 'ArrayExpression',
    elements: [
      { type: 'Identifier', name: 'e' },
      { type: 'Identifier', name: 'f' }
    ]
  }
}

const visitors = {
  Identifier(path, state) {
    // `state` is the state that has been passed in the `traverse` function
    state.count++;
    state.names.push(path.node.name);
  }
}

const data1 = {
  count: 0,
  names: []
}

const data2 = {
  count: 0,
  names: []
}

traverse(ast1, visitors, data1);
traverse(ast2, visitors, data2);

console.log(data1);
console.log(data2);

// Yay! We didn't have to write `visitors` two times.
// Just using states, we have increased our code's reusability.
```
```js Output
{ count: 4, names: [ 'a', 'b', 'c', 'd' ] }
{ count: 2, names: [ 'e', 'f' ] }
```

----------------------------------------------

### Stopping traversal 

You can stop the traversal using visitor context's `stop` method.

:::Alert
Your function has to be bindable. It won't work if it's not.

```js Bindable example
const visitors = {
  Literal() {
    this // { stop() {...} }
  }
}
```
```js Not bindable example
const visitors = {
  Literal: () => {
    this // unknown, can be anything
  }
}
```
:::

```js Code
const ast = {
  type: 'ExpressionStatement',
  expression: {
    type: 'ArrayExpression',
    elements: [
      { type: 'Identifier', name: 'a' },
      { type: 'Identifier', name: 'b' },
      { type: 'Identifier', name: 'c' },
      { type: 'Identifier', name: 'd' },
      { type: 'Identifier', name: 'e' },
      { type: 'Identifier', name: 'f' }
    ]
  }
}

traverse(ast, {
  Identifier(path) {
    console.log(path.node.name);
    if (path.node.name === 'c') {
      this.stop();
      console.log('Stopped!');
    }
  }
});
```

```txt Output
a
b
c
Stopped!
```

:::Alert
If you call `stop()` at *`enter`* visitor function, the consequent *`leave`*
visitor function would not get called.
:::
