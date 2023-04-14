module.exports = {
  parserOptions: {
    ecmaVersion: 2015,
    sourceType: "module"
  },

  extends: ["eslint:recommended", "prettier"],
  plugins: ["prettier"],

  rules: {
    "no-console": "warn"
  }
};
