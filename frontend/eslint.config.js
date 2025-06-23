import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  { ignores: ['dist', 'node_modules'] }, // Added node_modules to ignores
  {
    files: ['**/*.{js,jsx,ts,tsx}'], // Expanded to ts, tsx for future
    languageOptions: {
      ecmaVersion: 'latest', // Updated from 2020
      globals: {
        ...globals.browser,
        ...globals.node, // Added node globals for broader compatibility
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier: prettierPlugin, // Added prettier plugin
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...prettierConfig.rules, // Apply prettier rules (disables conflicting ESLint rules)
      'prettier/prettier': 'warn', // Show Prettier differences as warnings
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }], // Changed to warn, allow unused args starting with _
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
];
