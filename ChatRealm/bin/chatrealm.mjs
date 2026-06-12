#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const tsxLoader = require.resolve("tsx");
const tsxLoaderUrl = pathToFileURL(tsxLoader).href;
const mainPath = join(packageRoot, "src", "main.ts");
const child = spawn(
  process.execPath,
  ["--import", tsxLoaderUrl, mainPath, ...process.argv.slice(2)],
  {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  },
);

child.on("error", (error) => {
  console.error(`Failed to start ChatRealm: ${error.message}`);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (typeof code === "number") {
    process.exitCode = code;
    return;
  }

  if (signal !== null) {
    console.error(`ChatRealm stopped by signal: ${signal}`);
    process.exitCode = 1;
  }
});
