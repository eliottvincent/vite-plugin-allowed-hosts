import fs from "fs";
import { spawn } from "child_process";

async function run() {
  await Promise.all([build(), copy()]);
}

async function build() {
  await spawn("rollup", ["-c", "rollup.config.js"], { stdio: "inherit" });
}

async function copy() {
  await fs.promises.copyFile("src/index.mjs", "dist/vite-plugin-allowed-hosts.mjs");
}

run();
