import js from '@eslint/js'
import globals from 'globals'
import typescriptPlugin from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  js.configs.recommended,
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.eslintrc.cjs',
      '**/*.mjs',
      'supabase/functions/**',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        React: 'readonly',
        ReactDOM: 'readonly',
      },
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...typescriptPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      ...reactHooks.configs.recommended.rules,
      'react-hooks/exhaustive-deps': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['vite.config.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
]
