import {
  Node,
  BlockStatement,
  ForInStatement,
  ForOfStatement,
  ForStatement,
  Pattern,
  VariableDeclaration,
  FunctionDeclaration,
  FunctionExpression,
  ArrowFunctionExpression,
  Program,
  ImportDeclaration
} from 'estree';

import { NodePath } from './nodepath';

export const hasBinding = (() => {
  const findInPattern = (node: Pattern, bindingName: string): boolean => {
    switch (node.type) {
      case 'Identifier':
        if (node.name === bindingName) return true;
        break;
      
      case 'ObjectPattern':
        for (let i = 0; i < node.properties.length; i++) {
          const property = node.properties[i];
          if (property.type === 'RestElement') {
            return findInPattern(property.argument, bindingName);
          } else {
            if (property.value != null) {
              return findInPattern(property.value, bindingName);
            } else {
              if (property.key.type === 'Identifier') {
                if (property.key.name === bindingName) return true;
              }
            }
          }
        }
        break;
      
      case 'ArrayPattern':
        for (let i = 0; i < node.elements.length; i++) {
          if (findInPattern(node.elements[i], bindingName)) return true;
        }
        break;
    }

    return false;
  }

  const findInVariableDeclaration = (node: VariableDeclaration, bindingName: string): boolean => {
    const declarations = node.declarations;
    if (declarations != null) {
      for (let i = 0; i < declarations.length; i++) {
        const { id } = declarations[i];
        if (findInPattern(id, bindingName)) return true;
      }
    }
    
    return false;
  }

  const findInImportDeclaration = (node: ImportDeclaration, bindingName: string): boolean => {
    for (let i = 0; i < node.specifiers.length; i++) {
      const specifier = node.specifiers[i];
      switch (specifier.type) {
        case 'ImportDefaultSpecifier':
        case 'ImportNamespaceSpecifier':
          if (specifier.local.name === bindingName) return true;
          break;
        
        case 'ImportSpecifier':
          if (specifier.local != null) {
            if (specifier.local.name === bindingName) return true;
          } else {
            if (specifier.imported.name === bindingName) return true;
          }
          break;
      }
    }

    return false;
  }

  const parentTypes: Node['type'][] = [
    'BlockStatement',
    'ForStatement',
    'ForInStatement',
    'ForOfStatement',
    'FunctionDeclaration',
    'FunctionExpression',
    'ArrowFunctionExpression',
    'Program'
  ];
  const findInParent = (path: NodePath, bindingName: string): boolean => {
    const parent = path.findParent<
      BlockStatement | ForStatement | ForInStatement | ForOfStatement |
      FunctionDeclaration | FunctionExpression | ArrowFunctionExpression |
      Program
    >(
      (p) => parentTypes.includes(p.type as Exclude<typeof p.type, null>)
    );

    if (parent != null) {
      switch (parent.node?.type) {
        case 'BlockStatement': {
          const statements = parent.node.body;
          for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.type === 'VariableDeclaration') {
              if (findInVariableDeclaration(statement, bindingName)) {
                return true;
              }
            }
          }
          break;
        }

        case 'ForStatement': {
          if (parent.node.init != null && parent.node.init.type === 'VariableDeclaration') {
            if (findInVariableDeclaration(parent.node.init, bindingName)) {
              return true;
            }
          }
          break;
        }

        case 'ForInStatement':
        case 'ForOfStatement': {
          if (parent.node.left.type === 'VariableDeclaration') {
            if (findInVariableDeclaration(parent.node.left, bindingName)) {
              return true;
            }
          }
          break;
        }

        case 'FunctionDeclaration':
        case 'FunctionExpression':
        case 'ArrowFunctionExpression': {
          const { params } = parent.node;
          for (let i = 0; i < params.length; i++) {
            if (findInPattern(params[i], bindingName)) {
              return true;
            }
          }
          break;
        }

        case 'Program': {
          const { body } = parent.node;
          for (let i = 0; i < body.length; i++) {
            const statement = body[i];
            if (statement.type === 'VariableDeclaration') {
              if (findInVariableDeclaration(statement, bindingName)) {
                return true;
              }
            } else if (statement.type === 'ImportDeclaration') {
              if (findInImportDeclaration(statement, bindingName)) {
                return true;
              }
            }
          }
          break;
        }
      }

      return findInParent(parent, bindingName);
    }

    return false;
  }

  return (path: NodePath, bindingName: string) => {
    return findInParent(path, bindingName);
  }
})();
