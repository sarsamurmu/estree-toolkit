<h1 align=center>
  <code>estree-toolkit</code>
</h1>
<h4 align=center>Tools for working with ESTree AST</h4>
<p align=center>
  <a href="https://npmjs.com/package/estree-toolkit">
    <img alt="npm" src="https://img.shields.io/npm/v/estree-toolkit?style=flat-square">
  </a>
  <a href="https://circleci.com/gh/sarsamurmu/estree-toolkit">
    <img alt="Circle CI" src="https://circleci.com/gh/sarsamurmu/estree-toolkit.svg?style=svg">
  </a>
  <a href="https://codecov.io/gh/sarsamurmu/estree-toolkit">
    <img alt="codecov" src="https://img.shields.io/codecov/c/github/sarsamurmu/estree-toolkit?style=flat-square">
  </a>
  <a href="https://github.com/sarsamurmu/estree-toolkit/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/sarsamurmu/estree-toolkit?style=flat-square">
  </a>
</p>

## Installation
```bash
npm i estree-toolkit
# or
yarn add estree-toolkit
```

## Usage
```js
// Supports both CommonJS and ES Modules
// ES Module
import { traverse, builders as b } from 'estree-toolkit';
// CommonJS
const { traverse, builders: b } = require('estree-toolkit');
```

## Basic operations
### Traversing an AST
```js
const { traverse } = require('estree-toolkit');

traverse(ast, {
  Program(path) {
    // Do something with the path
  }
});
```
### Building Nodes
```js
const { builders: b } = require('estree-toolkit');

b.identifier('x'); // => { type: 'Identifier', name: 'x' }
```
### Checking node types
```js
const { traverse, is } = require('estree-toolkit');
const { parseModule } = require('meriyah');

const ast = parseModule(`x = 0`);

traverse(ast, {
  AssignmentExpression(path) {
    if (is.identifier(path.node.left, { name: 'x' })) {
      // `left` is an identifier with name `x`
    }
  }
});
```
### Replacing a node
```js
const { traverse, builders: b } = require('estree-toolkit');
const { parseModule } = require('meriyah');

const ast = parseModule('a = b');

traverse(ast, {
  Identifier(path) {
    if (path.node.name === 'a') {
      path.replaceWith(b.identifier('c'));
    }
  }
});

// Now the AST represents - `c = b`
```
### Collecting scope information
```js
const { traverse } = require('estree-toolkit');

traverse(ast, {
  // Enable scope
  $: { scope: true },
  Program(path) {
    // `path.scope` is now available in all paths
  }
});
```
#### Checking if a binding is available
```js
const { traverse } = require('estree-toolkit');
const { parseModule } = require('meriyah');

const ast = parseModule(`
import { a } from 'source';

const { b, c: [d, { e }] } = a;
`);

traverse(ast, {
  $: { scope: true },
  Program(path) {
    path.scope.hasBinding('a') // => true
    path.scope.hasBinding('b') // => true
    path.scope.hasBinding('c') // => false
    path.scope.hasBinding('d') // => true
    path.scope.hasBinding('e') // => true
  }
});
```
#### Getting all references of a binding
```js
const { traverse } = require('estree-toolkit');
const { parseModule } = require('meriyah');

const ast = parseModule(`
import { a } from 'source';

fn(a);
s = a;
let obj = { a };
`);

traverse(ast, {
  $: { scope: true },
  Program(path) {
    // Returns all the paths that reference the binding `a`
    path.scope.getBinding('a').references // => [NodePath, NodePath, NodePath]
  }
});
```
#### Checking if a global has been used
```js
const { traverse } = require('estree-toolkit');
const { parseModule } = require('meriyah');

const ast = parseModule(`
const fx = require('fx-mod');
`);

traverse(ast, {
  $: { scope: true },
  Program(path) {
    path.scope.hasGlobalBinding('require') // => true
  }
});
```
#### Renaming a binding
```js
const { traverse } = require('estree-toolkit');
const { parseModule } = require('meriyah');

const ast = parseModule(`
const a = 0

a.reload()
while (a.ok) a.run()
`);

traverse(ast, {
  $: { scope: true },
  Program(path) {
    // `a` -> `b`
    path.scope.renameBinding('a', 'b')
  }
});

// Output code:
// const b = 0
//
// b.reload()
// while (b.ok) b.run()
```
### Utilities
There are several static utilities that you can use.
- `evaluate`\
  Evaluates the given path.
  ```js
  const { utils: u, traverse } = require('estree-toolkit');
  // We are using `meriyah` but you can use any parser (like `acorn`)
  const { parseModule } = require('meriyah');

  traverse(parseModule(`1 + 2`), {
    BinaryExpression(path) {
      u.evaluate(path) // => { value: 3 }
    }
  });

  traverse(parseModule(`1 === 2`), {
    BinaryExpression(path) {
      u.evaluate(path) // => { value: false }
    }
  });

  traverse(parseModule(`iDoNotKnowWhatThisIs === 55`), {
    BinaryExpression(path) {
      u.evaluate(path) // => undefined
    }
  });

  traverse(parseModule(`
    ({
      text: 'This is an object',
      data: [1, 'two']
    })
  `), {
    ObjectExpression(path) {
      u.evaluate(path) // => { value: { text: 'This is an object', data: [1, 'two'] } }
    }
  });

  traverse(parseModule(`1 > 5 ? 'YES' : 'NO'`), {
    ConditionalExpression(path) {
      u.evaluate(path) // => { value: 'NO' }
    }
  });
  ```
- `evaluateTruthy`\
  Evaluates the path for truthiness and returns `true`, `false` or `undefined` depending on
  evaluation result.

There's more functionalities, please read the documentation.

## Documentation
You can find the documentation at https://estree-toolkit.netlify.app/

## Why another traverser?
I know there is [Babel](https://github.com/babel/babel). But there are
other tools which are faster than Babel. For example, [`meriyah`](https://github.com/meriyah/meriyah) is 3x faster than [`@babel/parser`](https://www.npmjs.com/package/@babel/parser), [`astring`](https://github.com/davidbonnet/astring) is up to 50x faster than [`@babel/generator`](https://www.npmjs.com/package/@babel/generator). But these tool only work with ESTree AST. I wanted to use these
faster alternatives for one of my projects but could not find any traverser with
batteries-included. So I built one myself, with awesome scope analysis, it has all the things that you would need for traversing an ESTree AST. Also, a little bit faster than Babel.

## Need help?
If you need help in any kind of ESTree AST modification, then don't hesitate to open a new discussion in [Q&A Discussions](https://github.com/sarsamurmu/estree-toolkit/discussions/categories/q-a). I will try my best to help you :)

## License
Licensed under the [MIT License](/LICENSE).
