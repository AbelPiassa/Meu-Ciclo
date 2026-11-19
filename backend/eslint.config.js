import js from '@eslint/js';
import globals from 'globals';
export default [{ ignores: ['node_modules/**', 'data/**'] }, js.configs.recommended,
  { languageOptions: { globals: globals.node }, rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }] } }];
