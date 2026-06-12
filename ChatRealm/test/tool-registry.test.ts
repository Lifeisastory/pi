import assert from "node:assert/strict";
import test from "node:test";

import type { AgentTool } from "../src/tools/types";
import { createToolRegistry } from "../src/tools/registry";

const demoTool: AgentTool = {
  definition: {
    name: "demo",
    description: "Demo tool",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  execute: async () => ({
    content: "ok",
    isError: false,
  }),
};

test("ToolRegistry registers and lists tools", () => {
  const registry = createToolRegistry([demoTool]);

  assert.equal(registry.get("demo"), demoTool);
  assert.equal(registry.require("demo"), demoTool);
  assert.deepEqual(registry.definitions(), [demoTool.definition]);
});

test("ToolRegistry rejects duplicate, empty, and unknown tools", () => {
  assert.throws(
    () => createToolRegistry([demoTool, demoTool]),
    /Duplicate tool registered: demo/,
  );

  assert.throws(
    () =>
      createToolRegistry([
        {
          ...demoTool,
          definition: {
            ...demoTool.definition,
            name: " ",
          },
        },
      ]),
    /Tool name cannot be empty/,
  );

  assert.throws(
    () => createToolRegistry([demoTool]).require("missing"),
    /Unknown tool: missing/,
  );
});
