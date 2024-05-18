// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import vitest from "eslint-plugin-vitest";
import playwright from 'eslint-plugin-playwright'


export default tseslint.config(
  { ignores: ["playwright-report/*", "assets/*", "dist/*"]},
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.eslint.json', './engine/tsconfig.eslint.json', './tsconfig.spec.json', './engine/tsconfig.spec.json', './tsconfig.vite.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',

    },
  },
  {
      files: ["**/*.spec.ts", "**/vite.config.ts"], // or any other pattern
      plugins: {
        vitest
      },
      settings: {
        vitest: {
          typecheck: true,
        }
      },  
      languageOptions: {
        globals: {
          ...vitest.environments.env.globals,
        },
      },
      rules: {
        ...vitest.configs.recommended.rules,
        //...vitest.configs.all.rules,
        "vitest/max-nested-describe": ["error", { "max": 3 }],
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        'vitest/valid-expect': 'off',
    }, 
  },
  
  {
    ...playwright.configs['flat/recommended'],
    files: ['tests/**'],
  },
  {
    files: ['tests/**'],
    rules: {
      // Customize Playwright rules
      // ...
    },
  },
);