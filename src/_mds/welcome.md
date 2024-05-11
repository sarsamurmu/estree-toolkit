---
title: Welcome
---

`estree-toolkit` includes all the necessary tools to start working with ESTree.

------------------------

## Quick start
You can install `estree-toolkit` using `npm` or `yarn`

::::Tabs
:::Tab[npm]
```bash
npm i estree-toolkit
```
:::
:::Tab[yarn]
```bash
yarn add estree-toolkit
```
:::
::::

--------------------------

## Why another traverser?
I know there is [Babel](https://github.com/babel/babel). But there are
other tools which are faster than Babel. For example, [`meriyah`](https://github.com/meriyah/meriyah) is 3x faster than [`@babel/parser`](https://www.npmjs.com/package/@babel/parser), [`astring`](https://github.com/davidbonnet/astring) is up to 50x faster than [`@babel/generator`](https://www.npmjs.com/package/@babel/generator). But these tool only work with ESTree AST. I wanted to use these
faster alternatives for one of my projects but could not find any traverser with
batteries-included. So I made one myself, with awesome scope analysis, it has all the things that you would need for traversing an ESTree AST.
