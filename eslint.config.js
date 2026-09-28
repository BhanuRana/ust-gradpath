// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config")
const expoConfig = require("eslint-config-expo/flat")
const prettierConfig = require("eslint-config-prettier/flat")

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  { ignores: ["dist/*", "src/data/generated/*"] },
  {
    rules: {
      "import/order": [
        "error",
        {
          groups: [["builtin", "external"], "internal", ["parent", "sibling", "index"]],
          pathGroups: [{ pattern: "@/**", group: "internal" }],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },
])
