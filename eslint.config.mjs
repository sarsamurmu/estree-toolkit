import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import stylisticTS from '@stylistic/eslint-plugin-ts'
import stylisticJS from '@stylistic/eslint-plugin-js'

/* eslint-disable quote-props */

const rules = {
  '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
  'no-useless-constructor': 'off',
  '@typescript-eslint/no-useless-constructor': 'error',
  '@typescript-eslint/require-await': 'error',
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/no-for-in-array': 'error',
  '@typescript-eslint/no-unsafe-assignment': 'off',
  '@typescript-eslint/no-unsafe-call': 'off',
  '@typescript-eslint/no-unsafe-return': 'off',
  '@typescript-eslint/no-unsafe-member-access': 'off',
  '@typescript-eslint/no-unsafe-argument': 'off',
  '@typescript-eslint/no-unnecessary-type-assertion': 'off',

  'comma-spacing': 'off',
  '@stylistic/ts/comma-spacing': 'error',
  'quotes': 'off',
  '@stylistic/ts/quotes': ['error', 'single', { avoidEscape: true }],
  'require-await': 'off',
  'space-before-function-paren': 'off',
  '@stylistic/ts/space-before-function-paren': ['error', {
    anonymous: 'always',
    named: 'never',
    asyncArrow: 'always'
  }],
  '@stylistic/ts/explicit-module-boundary-types': 'off',
  '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],
  '@stylistic/ts/no-non-null-assertion': 'off',
  'semi': 'off',
  '@stylistic/ts/semi': ['error', 'never'],
}

const common = {
  extends: [
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
  ],
  plugins: {
    '@stylistic/ts': stylisticTS,
    '@stylistic/js': stylisticJS
  },
  rules: { ...rules }
}

/* export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: { ...rules }
  }
) */

export default [
  {
    rules: {
      'indent': ['error', 2, { SwitchCase: 1 }],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'eqeqeq': ['error', 'smart'],
      'arrow-parens': ['error', 'always'],
      'no-var': 'error',
      'no-unneeded-ternary': 'error',
      'space-before-function-paren': ['error', {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always'
      }],
      'quote-props': ['error', 'as-needed'],
      'semi': ['error', 'never'],
    },
    ignores: [
      'dist/**',
      'dist-es/**',
      'generator-scripts/**',
      'src/generated'
    ]
  },
  ...tseslint.config({
    files: ['**/*.ts'],
    ignores: ['src/generated/*.ts'],
    ...common,
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    }
  }),
  ...tseslint.config({
    files: ['tests/**/*.test.ts'],
    ...common,
    languageOptions: {
      parserOptions: {
        project: './tests/tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    }
  })
]
