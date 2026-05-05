import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'

/* eslint-disable quote-props */

const baseRules = {
  'eqeqeq': ['error', 'smart'],
  'no-var': 'error',
  'no-unneeded-ternary': 'error',
  'arrow-parens': ['error', 'always'],
  'quote-props': ['error', 'as-needed'],
}

const tsRules = {
  '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
  '@typescript-eslint/no-useless-constructor': 'error',
  '@typescript-eslint/require-await': 'error',
  '@typescript-eslint/no-for-in-array': 'error',
  '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],

  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/no-unsafe-assignment': 'off',
  '@typescript-eslint/no-unsafe-call': 'off',
  '@typescript-eslint/no-unsafe-return': 'off',
  '@typescript-eslint/no-unsafe-member-access': 'off',
  '@typescript-eslint/no-unsafe-argument': 'off',
  '@typescript-eslint/no-unnecessary-type-assertion': 'off',

  'no-useless-constructor': 'off',
  'require-await': 'off',
}

const stylisticRules = {
  '@stylistic/comma-spacing': 'error',
  '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
  '@stylistic/semi': ['error', 'never'],
  '@stylistic/space-before-function-paren': [
    'error',
    {
      anonymous: 'always',
      named: 'never',
      asyncArrow: 'always',
    },
  ],
}

export default defineConfig([
  {
    extends: [js.configs.recommended],
    rules: baseRules,
    ignores: [
      'dist/**',
      'dist-es/**',
      'generator-scripts/**',
      'src/generated',
    ],
  },

  {
    files: ['src/**/*.ts'],
    ignores: ['src/generated/*.ts'],
    extends: [tseslint.configs.recommendedTypeChecked],

    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },

    plugins: {
      '@typescript-eslint': tseslint.plugin,
      '@stylistic': stylistic,
    },

    rules: {
      ...tsRules,
      ...stylisticRules,
    },
  },

  {
    files: ['tests/**/*.ts'],
    extends: [tseslint.configs.recommendedTypeChecked],

    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tests/tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },

    plugins: {
      '@typescript-eslint': tseslint.plugin,
      '@stylistic': stylistic,
    },

    rules: {
      ...tsRules,
      ...stylisticRules,
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off'
    },
  },
])
