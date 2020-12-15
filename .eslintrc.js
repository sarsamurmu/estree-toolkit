/* eslint-disable quote-props */
const defaultTSOptions = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
    'comma-spacing': 'off',
    '@typescript-eslint/comma-spacing': 'error',
    'no-useless-constructor': 'off',
    '@typescript-eslint/no-useless-constructor': 'error',
    'quotes': 'off',
    '@typescript-eslint/quotes': ['error', 'single', { avoidEscape: true }],
    'require-await': 'off',
    '@typescript-eslint/require-await': 'error',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-for-in-array': 'error',
    'space-before-function-paren': 'off',
    '@typescript-eslint/space-before-function-paren': ['error', {
      anonymous: 'always',
      named: 'never',
      asyncArrow: 'always'
    }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],
    '@typescript-eslint/no-non-null-assertion': 'off'
  }
}

module.exports = {
  extends: ['eslint:recommended'],
  env: {
    es2020: true,
    node: true
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
    'indent': ['error', 2, { SwitchCase: 1 }],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'linebreak-style': ['error', 'windows'],
    'eqeqeq': ['error', 'smart'],
    'arrow-parens': ['error', 'always'],
    'no-var': 'error',
    'no-unneeded-ternary': 'error',
    'space-before-function-paren': ['error', {
      anonymous: 'always',
      named: 'never',
      asyncArrow: 'always'
    }],
    'quote-props': ['error', 'as-needed']
  },
  overrides: [
    {
      files: ['*.ts'],
      ...defaultTSOptions
    },
    {
      files: ['*.test.ts'],
      ...defaultTSOptions,
      parserOptions: {
        ...defaultTSOptions.parserOptions,
        project: './tests/tsconfig.json'
      },
      env: {
        es2020: true,
        node: true,
        jest: true
      }
    }
  ]
};
