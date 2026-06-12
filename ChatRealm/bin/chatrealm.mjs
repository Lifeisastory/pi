#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const tsxLoader = require.resolve("tsx");
const tsxLoaderUrl = pathToFileURL(tsxLoader).href;
const mainPath = join(packageRoot, "src", "main.ts");
const result = spawnSync(
  process.execPath,
  ["--import", tsxLoaderUrl, mainPath, ...process.argv.slice(2)],
  {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  },
);

if (result.error !== undefined) {
  console.error(`Failed to start ChatRealm: ${result.error.message}`);
  process.exitCode = 1;
} else if (typeof result.status === "number") {
  process.exitCode = result.status;
} else if (result.signal !== null) {
  console.error(`ChatRealm stopped by signal: ${result.signal}`);
  process.exitCode = 1;
}
