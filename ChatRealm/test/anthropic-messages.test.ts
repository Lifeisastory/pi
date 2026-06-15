import assert from "node:assert/strict";
import test from "node:test";

import { createAnthropicMessagesTransport } from "../src/ai/anthropic-messages";
import type { ChatRequest, ChatStreamEvent } from "../src/ai/types";
import { parseJsonObject } from "../src/utils/json";

const request: ChatRequest = {
  model: "claude-demo",
  systemPrompt: "You are concise.",
  messages: [
    {
      role: "user",
      content: "hello",
    },
    {
      role: "assistant",
      content: [
        {
          type: "text",
          text: "prior",
        },
        {
          type: "toolCall",
          id: "toolu_previous",
          name: "read_file",
          arguments: {
            path: "README.md",
          },
        },
      ],
      model: "claude-demo",
      usage: undefined,
      stopReason: "toolUse",
      errorMessage: undefined,
    },
    {
      role: "toolResult",
      toolCallId: "toolu_previous",
      toolName: "read_file",
      content: "ok",
      isError: false,
    },
  ],
  tools: [
    {
      name: "search",
      description: "Search files",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
          },
        },
        required: ["query"],
      },
    },
  ],
};

test("Anthropic Messages transport maps requests and non-stream responses", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl: string | undefined;
  let requestedInit: RequestInit | undefined;

  globalThis.fetch = async (
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> => {
    requestedUrl = input instanceof Request ? input.url : input.toString();
    requestedInit = init;

    return Response.json({
      content: [
        {
          type: "text",
          text: "hello",
        },
        {
          type: "tool_use",
          id: "toolu_next",
          name: "search",
          input: {
            query: "abc",
          },
        },
      ],
      stop_reason: "tool_use",
      usage: {
        input_tokens: 10,
        output_tokens: 2,
        cache_read_input_tokens: 4,
        cache_creation_input_tokens: 1,
      },
    });
  };

  try {
    const transport = createAnthropicMessagesTransport({
      apiKey: "test-key",
      baseUrl: "https://example.test/v1/",
    });
    const response = await transport.complete(request);

    assert.equal(requestedUrl, "https://example.test/v1/messages");
    assert.equal(new Headers(requestedInit?.headers).get("x-api-key"), "test-key");
    assert.equal(new Headers(requestedInit?.headers).get("anthropic-version"), "2023-06-01");
    assert.deepEqual(parseJsonObject(String(requestedInit?.body), "request body"), {
      model: "claude-demo",
      max_tokens: 4096,
      system: "You are concise.",
      messages: [
        {
          role: "user",
          content: "hello",
        },
        {
          role: "assistant",
          content: [
            {
              type: "text",
              text: "prior",
            },
            {
              type: "tool_use",
              id: "toolu_previous",
              name: "read_file",
              input: {
                path: "README.md",
              },
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: "toolu_previous",
              content: "ok",
              is_error: false,
            },
          ],
        },
      ],
      tools: [
        {
          name: "search",
          description: "Search files",
          input_schema: {
            type: "object",
            properties: {
              query: {
                type: "string",
              },
            },
            required: ["query"],
          },
        },
      ],
    });
    assert.deepEqual(response.message.content, [
      {
        type: "text",
        text: "hello",
      },
      {
        type: "toolCall",
        id: "toolu_next",
        name: "search",
        arguments: {
          query: "abc",
        },
      },
    ]);
    assert.equal(response.message.stopReason, "toolUse");
    assert.deepEqual(response.message.usage, {
      inputTokens: 15,
      outputTokens: 2,
      totalTokens: 17,
      inputCacheHitTokens: 4,
      inputCacheMissTokens: 11,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Anthropic Messages transport streams text deltas, tool calls, and final response", async () => {
  const originalFetch = globalThis.fetch;
  const sse = [
    `event: message_start\ndata: ${JSON.stringify({
      type: "message_start",
      message: {
        usage: {
          input_tokens: 5,
          output_tokens: 0,
          cache_read_input_tokens: 2,
          cache_creation_input_tokens: 1,
        },
      },
    })}`,
    "",
    `event: content_block_start\ndata: ${JSON.stringify({
      type: "content_block_start",
      index: 0,
      content_block: {
        type: "text",
        text: "",
      },
    })}`,
    "",
    `event: content_block_delta\ndata: ${JSON.stringify({
      type: "content_block_delta",
      index: 0,
      delta: {
        type: "text_delta",
        text: "he",
      },
    })}`,
    "",
    `event: content_block_delta\ndata: ${JSON.stringify({
      type: "content_block_delta",
      index: 0,
      delta: {
        type: "text_delta",
        text: "llo",
      },
    })}`,
    "",
    `event: content_block_stop\ndata: ${JSON.stringify({
      type: "content_block_stop",
      index: 0,
    })}`,
    "",
    `event: content_block_start\ndata: ${JSON.stringify({
      type: "content_block_start",
      index: 1,
      content_block: {
        type: "tool_use",
        id: "toolu_stream",
        name: "search",
        input: {},
      },
    })}`,
    "",
    `event: content_block_delta\ndata: ${JSON.stringify({
      type: "content_block_delta",
      index: 1,
      delta: {
        type: "input_json_delta",
        partial_json: "{\"query\"",
      },
    })}`,
    "",
    `event: content_block_delta\ndata: ${JSON.stringify({
      type: "content_block_delta",
      index: 1,
      delta: {
        type: "input_json_delta",
        partial_json: ":\"abc\"}",
      },
    })}`,
    "",
    `event: content_block_stop\ndata: ${JSON.stringify({
      type: "content_block_stop",
      index: 1,
    })}`,
    "",
    `event: message_delta\ndata: ${JSON.stringify({
      type: "message_delta",
      delta: {
        stop_reason: "tool_use",
      },
      usage: {
        output_tokens: 3,
      },
    })}`,
    "",
    `event: message_stop\ndata: ${JSON.stringify({
      type: "message_stop",
    })}`,
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
    const transport = createAnthropicMessagesTransport({
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

    const toolCallEvent = events.find((event) => event.type === "toolCall");

    assert.equal(toolCallEvent?.type, "toolCall");

    if (toolCallEvent?.type !== "toolCall") {
      throw new Error("Expected toolCall event");
    }

    assert.deepEqual(toolCallEvent.toolCall, {
      type: "toolCall",
      id: "toolu_stream",
      name: "search",
      arguments: {
        query: "abc",
      },
    });

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
      {
        type: "toolCall",
        id: "toolu_stream",
        name: "search",
        arguments: {
          query: "abc",
        },
      },
    ]);
    assert.equal(doneEvent.response.message.stopReason, "toolUse");
    assert.deepEqual(doneEvent.response.message.usage, {
      inputTokens: 8,
      outputTokens: 3,
      totalTokens: 11,
      inputCacheHitTokens: 2,
      inputCacheMissTokens: 6,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
