import {
  Node,
  Pattern,
  VariableDeclaration,
  ImportDeclaration,
  Statement,
  ModuleDeclaration
} from 'estree';

import { NodePath } from './nodepath';

export type NodeMap = { [N in Node as `${N['type']}`]: N; }
export type NodeT<N extends keyof NodeMap> = NodeMap[N];

export const hasBinding = (() => {
  const findInPattern = (node: Pattern, bindingName: string): boolean => {
    switch (node.type) {
      case 'Identifier':
        return node.name === bindingName;
      
      case 'ObjectPattern':
        for (let i = 0; i < node.properties.length; i++) {
          const property = node.properties[i];
          if (property.type === 'RestElement') {
            return findInPattern(property.argument, bindingName);
          } else {
            if (property.value != null) {
              if (findInPattern(property.value, bindingName)) return true;
            } else {
              if (
                !property.computed &&
                property.key.type === 'Identifier' &&
                property.key.name === bindingName
              ) {
                return true;
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
      
      case 'RestElement':
        return findInPattern(node.argument, bindingName);
      
      case 'AssignmentPattern':
        return findInPattern(node.left, bindingName);
    }

    return false;
  }

  const findInVariableDeclaration = (node: VariableDeclaration, bindingName: string): boolean => {
    const { declarations } = node;
    for (let i = 0; i < declarations.length; i++) {
      if (findInPattern(declarations[i].id, bindingName)) return true;
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

  const findInStatements = (statements: (Statement | ModuleDeclaration)[], bindingName: string): boolean => {
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      switch (statement.type) {
        case 'ImportDeclaration': {
          if (findInImportDeclaration(statement, bindingName)) {
            return true;
          }
          break;
        }

        case 'VariableDeclaration': {
          if (findInVariableDeclaration(statement, bindingName)) {
            return true;
          }
          break;
        }

        case 'FunctionDeclaration':
        case 'ClassDeclaration': {
          if (statement.id?.name === bindingName) return true;
          break;
        }
      }
    }
    return false;
  }

  const parentTypes = [
    'BlockStatement',
    'ForStatement',
    'ForInStatement',
    'ForOfStatement',
    'FunctionDeclaration',
    'FunctionExpression',
    'ArrowFunctionExpression',
    'ClassDeclaration',
    'Program'
  ] as const;
  type ParentType = {
    [N in Node as `${N['type']}`]: N['type'] extends typeof parentTypes[number] ? N : never;
  }[Node['type']];
  
  const findInParent = (path: NodePath, bindingName: string): boolean => {
    const parent = path.findParent<ParentType>(
      (p) => parentTypes.includes(p.type!)
    );

    if (parent != null) {
      const { node } = parent;
      switch (node?.type) {
        case 'BlockStatement': {
          if (findInStatements(node.body, bindingName)) {
            return true;
          }
          break;
        }

        case 'ForStatement': {
          if (node.init != null && node.init.type === 'VariableDeclaration') {
            if (findInVariableDeclaration(node.init, bindingName)) {
              return true;
            }
          }
          break;
        }

        case 'ForInStatement':
        case 'ForOfStatement': {
          if (node.left.type === 'VariableDeclaration') {
            if (findInVariableDeclaration(node.left, bindingName)) {
              return true;
            }
          }
          break;
        }

        case 'FunctionDeclaration':
        case 'FunctionExpression':
        case 'ArrowFunctionExpression': {
          if (
            node.type === 'FunctionDeclaration' &&
            node.id?.name === bindingName
          ) return true;

          for (let i = 0; i < node.params.length; i++) {
            if (findInPattern(node.params[i], bindingName)) {
              return true;
            }
          }
          break;
        }

        case 'ClassDeclaration': {
          if (node.id?.name === bindingName) return true;
          break;
        }

        case 'Program': {
          if (findInStatements(node.body, bindingName)) {
            return true;
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
