export { evaluate, evaluateTruthy } from './evaluate'
export { hasBinding } from './hasBinding'

import { NodePath, NodePathT } from '../nodepath'

export const getCommonAncestor = (paths: NodePath[]): NodePath | null => {
  const ancestorsArr = []
  for (let i = 0; i < paths.length; i++) {
    const ancestors = []
    let parent = paths[i].parentPath
    while (parent != null) {
      ancestors.push(parent)
      parent = parent.parentPath
    }
    ancestorsArr.push(ancestors.reverse())
  }

  let common = null
  let currAncestor
  for (let i = 0;; i++) {
    currAncestor = ancestorsArr[0][i]
    for (let j = 0; j < paths.length; j++) {
      if (currAncestor !== ancestorsArr[j][i]) return common
    }
    common = currAncestor
  }
}

export const isReference = (path: NodePathT<'Identifier' | 'JSXIdentifier'>, includeGlobals = true) => {
  if (!path.scope) {
    throw new Error("Can't use isReference() when `scope` is not enabled")
  }

  const binding = path.scope.getBinding(path.node!.name)
  if (binding != null) {
    return path === binding.identifierPath || binding.references.includes(path)
  }

  if (!includeGlobals) return false

  const globalBinding = path.scope.getGlobalBinding(path.node!.name)
  if (globalBinding != null) {
    return globalBinding.references.includes(path)
  }
  
  
  return false
}
