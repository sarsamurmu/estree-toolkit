import {
  Pattern,
  VariableDeclaration,
  ImportDeclaration,
  Statement,
  ModuleDeclaration
} from 'estree-jsx'
import { NodeMap } from '../estree'
import { NodePath } from '../nodepath'

export const hasBinding = (() => {
  const findInPattern = (node: Pattern, bindingName: string): boolean => {
    switch (node.type) {
      case 'Identifier':
        return node.name === bindingName
      
      case 'ObjectPattern': {
        const { properties } = node
        for (let i = 0; i < properties.length; i++) {
          const property = properties[i]
          if (property.type === 'RestElement') {
            if (findInPattern(property.argument, bindingName)) return true
          } else {
            /* istanbul ignore else */
            if (property.value != null) {
              if (findInPattern(property.value, bindingName)) return true
            } else {
              if (
                !property.computed &&
                property.key.type === 'Identifier' &&
                property.key.name === bindingName
              ) {
                return true
              }
            }
          }
        }
        break
      }
      
      case 'ArrayPattern': {
        const { elements } = node
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i]
          if (element == null) continue
          if (findInPattern(element, bindingName)) return true
        }
        break
      }
      
      case 'RestElement':
        return findInPattern(node.argument, bindingName)
      
      case 'AssignmentPattern':
        return findInPattern(node.left, bindingName)
    }

    return false
  }

  const findInVariableDeclaration = (node: VariableDeclaration, bindingName: string): boolean => {
    const { declarations } = node
    for (let i = 0; i < declarations.length; i++) {
      if (findInPattern(declarations[i].id, bindingName)) return true
    }
    
    return false
  }

  const findInImportDeclaration = (node: ImportDeclaration, bindingName: string): boolean => {
    for (let i = 0; i < node.specifiers.length; i++) {
      const specifier = node.specifiers[i]
      switch (specifier.type) {
        case 'ImportDefaultSpecifier':
        case 'ImportNamespaceSpecifier':
          if (specifier.local.name === bindingName) return true
          break
        
        case 'ImportSpecifier':
          /* istanbul ignore else */
          if (specifier.local != null) {
            if (specifier.local.name === bindingName) return true
          } else {
            if (specifier.imported.name === bindingName) return true
          }
          break
      }
    }

    return false
  }

  const findInStatements = (statements: (Statement | ModuleDeclaration)[], bindingName: string): boolean => {
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      switch (statement.type) {
        case 'ImportDeclaration': {
          if (findInImportDeclaration(statement, bindingName)) {
            return true
          }
          break
        }

        case 'VariableDeclaration': {
          if (findInVariableDeclaration(statement, bindingName)) {
            return true
          }
          break
        }

        case 'FunctionDeclaration':
        case 'ClassDeclaration': {
          if (statement.id?.name === bindingName) return true
          break
        }
      }
    }
    return false
  }

  const parentTypes = [
    'BlockStatement',
    'CatchClause',
    'ForStatement',
    'ForInStatement',
    'ForOfStatement',
    'FunctionDeclaration',
    'FunctionExpression',
    'ArrowFunctionExpression',
    'ClassDeclaration',
    'ClassExpression',
    'Program'
  ] as const
  type ParentType = {
    [K in keyof NodeMap]: K extends typeof parentTypes[number] ? NodeMap[K] : never;
  }[keyof NodeMap]
  
  const findInParent = (path: NodePath, bindingName: string): boolean => {
    const parent = path.findParent<ParentType>(
      (p) => parentTypes.includes(p.type!)
    )

    if (parent != null && parent.node != null) {
      const { node } = parent

      switch (node.type) {
        case 'BlockStatement': {
          if (findInStatements(node.body, bindingName)) {
            return true
          }
          break
        }

        case 'CatchClause': {
          if (node.param != null && findInPattern(node.param, bindingName)) {
            return true
          }
          break
        }

        case 'ForStatement': {
          /* istanbul ignore else */
          if (node.init != null && node.init.type === 'VariableDeclaration') {
            if (findInVariableDeclaration(node.init, bindingName)) {
              return true
            }
          }
          break
        }

        case 'ForInStatement':
        case 'ForOfStatement': {
          /* istanbul ignore else */
          if (node.left.type === 'VariableDeclaration') {
            if (findInVariableDeclaration(node.left, bindingName)) {
              return true
            }
          }
          break
        }

        case 'FunctionDeclaration':
        case 'FunctionExpression':
        case 'ArrowFunctionExpression': {
          if (
            node.type !== 'ArrowFunctionExpression' &&
            node.id?.name === bindingName
          ) return true

          for (let i = 0; i < node.params.length; i++) {
            if (findInPattern(node.params[i], bindingName)) {
              return true
            }
          }
          break
        }

        case 'ClassExpression':
        case 'ClassDeclaration': {
          /* istanbul ignore else */
          if (node.id?.name === bindingName) return true
          break
        }

        case 'Program': {
          if (findInStatements(node.body, bindingName)) {
            return true
          }
          break
        }
      }

      return findInParent(parent, bindingName)
    }

    return false
  }

  return (path: NodePath, bindingName: string) => {
    return findInParent(path, bindingName)
  }
})()
