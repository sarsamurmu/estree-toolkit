const tools = require('../');
const meriyah = require('meriyah');
const { generate } = require('escodegen');

const code = `
let x = null;
`;

const ast = meriyah.parseModule(code);
const traverse = tools.createTraverser({});

// console.dir(ast, { depth: null });

traverse(ast, {
  Literal(path) {
    console.log(path);
    path.node.value = 'ddx';
    path.remove();
  }
});

console.log(`
-------------------------------------
${generate(ast)}
-------------------------------------
`);
