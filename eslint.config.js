import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default [
  eslintPluginPrettierRecommended,
  eslintConfigPrettier,

  {
    languageOptions: {
      ecmaVersion: 2015,
      sourceType: "module"
    },

    rules: {
      "no-console": "warn"
    }
  }
];