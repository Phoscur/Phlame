// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import vitest from "eslint-plugin-vitest";
import playwright from 'eslint-plugin-playwright'


export default tseslint.config(
  { ignores: ["playwright-report/*", "assets/*", "dist/*"]},
  eslint.configs.recommended,
  //...tseslint.configs.recommended,
  ...tseslint.configs.stylisticTypeChecked,
  ...tseslint.configs.recommendedTypeChecked,
  
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.eslint.json', './engine/tsconfig.eslint.json', './tsconfig.spec.json', './engine/tsconfig.spec.json', './tsconfig.vite.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      //'@typescript-eslint/no-unsafe-argument': 'error',
      //'@typescript-eslint/no-unsafe-assignment': 'error',
      //'@typescript-eslint/no-unsafe-return': 'error',
    },
  },
  {
      files: ["**/*.spec.ts", "**/vite.config.ts"], // or any other pattern
      plugins: {
        vitest
      },
      rules: {
        ...vitest.configs.recommended.rules,
        //...vitest.configs.all.rules,
        "vitest/max-nested-describe": ["error", { "max": 3 }],
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
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