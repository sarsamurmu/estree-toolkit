## 1.7.13
- Fix incorrect renaming in `AssignmentPattern` inside `ObjectPattern`

## 1.7.12
- Add default type for generic `CompT` of `traverse` function

## 1.7.10
- Enforce `@types/estree` version

## 1.7.9
- Better type support when sharing a visitor between different node types using the new `comp` field
- Fix `undefined` being marked as a reserved keyword
- Updated dependencies

## 1.7.8
- Add `isReference` utility function
- Fix reference collection issue with computed `PropertyDefinition`

## 1.7.7
- More fix to JSX related builders

## 1.7.6
- Fix JSX related builder names

## 1.7.5
- Remove unused dependencies

## 1.7.4
- Add `CatchClause` to `hasBinding`
- Updated dependencies

## 1.7.3
- Handle cases where `CatchClause` parameter is null

## 1.7.2
- Fix crash when one of the children was `null` when calling `skipChildren`

## 1.7.1
- Enabled `"moduleResolution": "bundler"` support for typescript

## 1.7.0
- New method for NodePath - `cloneNode`, `skipChildren`, `unSkipChildren`

## 1.6.2
- Updated dependencies
- Added support for ES Modules

## 1.6.1
- More bug fixes

## 1.6.0
- New methods for Scope - `generateUid`, `generateUidIdentifier`,
  `generateDeclaredUidIdentifier`
- Bug fixes related to scope

## 1.5.0
- New methods [`NodePath.getAncestry`](https://estree-toolkit.netlify.app/nodepath/#getancestry)
  and [`Scope.renameBinding`](https://estree-toolkit.netlify.app/scope/#renamebindingoldname-newname)
- New utility [`getCommonAncestor`](https://estree-toolkit.netlify.app/utilities/#getcommonancestorpaths)
- Fixed many bugs

## 1.4.0
- Updated all dependencies

## 1.3.1
- Added `ObjectExpression` and `ArrayExpression` evaluators
- Improved code

## 1.3.0
- Added support for JSX

## 1.2.7
- Fixed issue in `Scope` where parent scope were not being assigned

## 1.2.6
- Fixed infinite loop in `NodePath`

## 1.2.4
- Improved validators.
- Fixed issue with `Identifier` validator [(#1)](https://github.com/sarsamurmu/estree-toolkit/issues/1)

## 1.2.3
- Disable validation in builders temporarily

## 1.2.2
- Added node validator to all builders

## 1.2.0
- Updated to latest `@types/estree`
- Improved compatibility with latest TypeScript

## 1.1.0
- More fixes

## 1.0.9
- Fix `NodePath`'s synchronization

## 1.0.8
- Export more types

## 1.0.7
- Add `hasBinding` method to `Scope`

## 1.0.6
- Improve typings

## 1.0.5
- Fix TypeScript types

## 1.0.4
- Add support for `ExportDeclaration` alias.

## 1.0.3
- Add support for evaluating `UnaryExpression`

## 1.0.2
- Update `@types/estree` dependency

## 1.0.1
- Remove useless files
