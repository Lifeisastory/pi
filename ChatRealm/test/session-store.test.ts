import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import type { Message } from "../src/ai/types";
import {
  getSessionPath,
  loadSessionMessages,
  saveSessionMessages,
} from "../src/session/store";

test("session store preserves input cache usage fields", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "chatrealm-session-cache-"));
  const messages: Message[] = [
    {
      role: "assistant",
      content: [
        {
          type: "text",
          text: "hello",
        },
      ],
      model: "demo-model",
      usage: {
        inputTokens: 10,
        outputTokens: 2,
        totalTokens: 12,
        inputCacheHitTokens: 7,
        inputCacheMissTokens: 3,
      },
      stopReason: "stop",
      errorMessage: undefined,
    },
  ];

  try {
    await saveSessionMessages({ cwd }, messages);

    assert.deepEqual(await loadSessionMessages({ cwd }), messages);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("session store accepts older usage objects without cache fields", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "chatrealm-session-cache-"));
  const sessionPath = getSessionPath({ cwd });

  try {
    await mkdir(dirname(sessionPath), { recursive: true });
    await writeFile(
      sessionPath,
      `${JSON.stringify({
        version: 1,
        savedAt: new Date().toISOString(),
        messages: [
          {
            role: "assistant",
            content: [
              {
                type: "text",
                text: "hello",
              },
            ],
            model: "demo-model",
            usage: {
              inputTokens: 10,
              outputTokens: 2,
              totalTokens: 12,
            },
            stopReason: "stop",
          },
        ],
      })}\n`,
      "utf8",
    );

    const messages = await loadSessionMessages({ cwd });
    const message = messages[0];

    assert.equal(message?.role, "assistant");

    if (message?.role !== "assistant") {
      throw new Error("Expected assistant message");
    }

    assert.deepEqual(message.usage, {
      inputTokens: 10,
      outputTokens: 2,
      totalTokens: 12,
      inputCacheHitTokens: undefined,
      inputCacheMissTokens: undefined,
    });
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
