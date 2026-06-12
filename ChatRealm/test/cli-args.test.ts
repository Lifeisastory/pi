import assert from "node:assert/strict";
import test from "node:test";

import { getHelpText, parseArgs } from "../src/cli/args";

test("parseArgs reads explicit prompt and option values", () => {
  assert.deepEqual(
    parseArgs([
      "--prompt",
      "hello",
      "--model",
      "demo-model",
      "--provider",
      "demo-provider",
      "--cwd",
      ".",
    ]),
    {
      prompt: "hello",
      model: "demo-model",
      provider: "demo-provider",
      cwd: ".",
      help: false,
    },
  );
});

test("parseArgs joins positional prompt text", () => {
  assert.deepEqual(parseArgs(["write", "a", "short", "greeting"]), {
    prompt: "write a short greeting",
    model: undefined,
    provider: undefined,
    cwd: undefined,
    help: false,
  });
});

test("parseArgs prefers explicit prompt over positional text", () => {
  assert.equal(parseArgs(["-p", "hello", "ignored"]).prompt, "hello");
});

test("parseArgs handles help flags", () => {
  assert.equal(parseArgs(["--help"]).help, true);
  assert.match(getHelpText(), /--provider <name>/);
});

test("parseArgs rejects unknown options and missing values", () => {
  assert.throws(() => parseArgs(["--bad"]), /Unknown option: --bad/);
  assert.throws(() => parseArgs(["--model"]), /Missing value for --model/);
});
