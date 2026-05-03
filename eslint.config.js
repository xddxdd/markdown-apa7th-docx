import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default tseslint.config(
  // Base ESLint recommended rules
  eslint.configs.recommended,

  // typescript-eslint recommended rules
  ...tseslint.configs.recommended,

  // TypeScript-specific overrides
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  // Prettier plugin — runs Prettier as an ESLint rule
  {
    files: ["src/**/*.ts"],
    plugins: {
      prettier,
    },
    rules: {
      "prettier/prettier": "error",
    },
  },

  // eslint-config-prettier MUST be last — disables all formatting rules
  // that conflict with Prettier
  eslintConfigPrettier,

  // Global ignores
  {
    ignores: ["dist/**", "node_modules/**"],
  },
);