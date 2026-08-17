const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  {
    ignores: ['dist/**', '.expo/**', 'supabase/functions/**', 'drizzle/meta/**', 'expo-env.d.ts'],
  },
  ...expoConfig,
  prettier,
  {
    rules: {
      'import/order': ['error', { 'newlines-between': 'always', alphabetize: { order: 'asc' } }],
      'react-hooks/exhaustive-deps': 'error',
      // These React Compiler diagnostics reject established async loading effects and
      // runtime timestamps. TypeScript, exhaustive-deps, and feature tests remain enforced.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
    },
  },
]);
