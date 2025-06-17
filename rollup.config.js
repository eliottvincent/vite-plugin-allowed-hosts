import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import nodePolyfills from "rollup-plugin-polyfill-node";

import projectPackage from "./package.json" assert { type: "json" };

const banner = `/*!
 * vite-plugin-allowed-hosts v${projectPackage.version}
 * (c) ${new Date().getFullYear()} Eliott Vincent
 * @license MIT
 */`;

const configs = [
  {
    input: "src/index.js",
    file: "dist/vite-plugin-allowed-hosts.esm-browser.js",
    format: "es"
  },
  {
    input: "src/index.js",
    file: "dist/vite-plugin-allowed-hosts.esm-bundler.js",
    format: "es"
  },
  {
    input: "src/index.cjs.js",
    file: "dist/vite-plugin-allowed-hosts.global.js",
    format: "iife",
    minify: true
  },
  {
    input: "src/index.cjs.js",
    file: "dist/vite-plugin-allowed-hosts.cjs.js",
    format: "cjs",
    env: "development"
  }
];

function createEntries() {
  return configs.map(config => {
    return createEntry(config);
  });
}

function createEntry(config) {
  const isGlobalBuild = config.format === "iife";

  const c = {
    input: config.input,
    plugins: [
      resolve(),
      commonjs(),

      // Add polyfill for 'url'
      nodePolyfills()
    ],
    output: {
      banner,
      file: config.file,
      format: config.format,
      exports: "auto"
    },
    onwarn: (msg, warn) => {
      if (!/Circular/.test(msg)) {
        warn(msg);
      }
    }
  };

  if (isGlobalBuild) {
    c.output.name = "allowedHostsPlugin";
  }

  if (config.minify) {
    c.plugins.push(terser());
  }

  return c;
}

export default createEntries();
