import globals from 'globals';
import pluginJs from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module', // Assuming ES Modules for backend code, adjust if CommonJS is strictly used
      globals: {
        ...globals.node,
        ...globals.commonjs, // If you are using CommonJS
      },
    },
  },
  pluginJs.configs.recommended,
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      ...prettierConfig.rules, // Apply Prettier's rules
      'prettier/prettier': 'error', // Report Prettier differences as errors
      'no-console': 'warn', // Keep the warning for console.log
    },
  },
  {
    // Configuration for backend/index.js if it's CommonJS
    // ESLint's flat config is very specific. If index.js is CommonJS,
    // its sourceType needs to be 'commonjs'.
    // We can target specific files or patterns.
    files: ['backend/**/*.js'], // Adjust pattern as needed
    languageOptions: {
      sourceType: 'commonjs', // Override for backend files if they are CommonJS
    },
  },
];
