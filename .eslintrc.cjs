/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "import", "unused-imports"],
  extends: [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier"
  ],
  rules: {
    "unused-imports/no-unused-imports": "warn",
    "import/order": ["warn", { "newlines-between": "always", "alphabetize": { "order": "asc", "caseInsensitive": true } }]
  }
};
