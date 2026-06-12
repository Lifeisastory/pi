import assert from "node:assert/strict";
import test from "node:test";

import { createOpenAICompatibleTransport } from "../src/ai/openai-compatible";
import type { ChatRequest, ChatStreamEvent } from "../src/ai/types";

const request: ChatRequest = {
  model: "demo-model",
  systemPrompt: undefined,
  messages: [
    {
      role: "user",
      content: "hello",
    },
  ],
  tools: [],
};

test("OpenAI-compatible transport streams text deltas and final response", async () => {
  const originalFetch = globalThis.fetch;
  const sse = [
    'data: {"choices":[{"delta":{"content":"he"},"finish_reason":null}],"usage":null}',
    "",
    'data: {"choices":[{"delta":{"content":"llo"},"finish_reason":"stop"}],"usage":{"prompt_tokens":10,"completion_tokens":2,"total_tokens":12,"prompt_cache_hit_tokens":7,"prompt_cache_miss_tokens":3}}',
    "",
    "data: [DONE]",
    "",
  ].join("\n");

  globalThis.fetch = async (): Promise<Response> =>
    new Response(sse, {
      status: 200,
      headers: {
        "content-type": "text/event-stream",
      },
    });

  try {
    const transport = createOpenAICompatibleTransport({
      apiKey: "test-key",
    });
    const events: ChatStreamEvent[] = [];

    if (transport.stream === undefined) {
      throw new Error("Expected streaming transport");
    }

    for await (const event of transport.stream(request)) {
      events.push(event);
    }

    assert.deepEqual(
      events.filter((event) => event.type === "textDelta"),
      [
        {
          type: "textDelta",
          delta: "he",
        },
        {
          type: "textDelta",
          delta: "llo",
        },
      ],
    );

    const doneEvent = events.find((event) => event.type === "done");

    assert.equal(doneEvent?.type, "done");

    if (doneEvent?.type !== "done") {
      throw new Error("Expected done event");
    }

    assert.deepEqual(doneEvent.response.message.content, [
      {
        type: "text",
        text: "hello",
      },
    ]);
    assert.deepEqual(doneEvent.response.message.usage, {
      inputTokens: 10,
      outputTokens: 2,
      totalTokens: 12,
      inputCacheHitTokens: 7,
      inputCacheMissTokens: 3,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OpenAI-compatible transport derives cache miss tokens from prompt details", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (): Promise<Response> =>
    Response.json({
      choices: [
        {
          finish_reason: "stop",
          message: {
            content: "hello",
          },
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 2,
        total_tokens: 12,
        prompt_tokens_details: {
          cached_tokens: 6,
        },
      },
    });

  try {
    const transport = createOpenAICompatibleTransport({
      apiKey: "test-key",
    });
    const response = await transport.complete(request);

    assert.deepEqual(response.message.usage, {
      inputTokens: 10,
      outputTokens: 2,
      totalTokens: 12,
      inputCacheHitTokens: 6,
      inputCacheMissTokens: 4,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
