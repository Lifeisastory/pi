import assert from "node:assert/strict";
import test from "node:test";

import { createOpenAIResponsesTransport } from "../src/ai/openai-responses";
import type { ChatRequest, ChatStreamEvent } from "../src/ai/types";
import { parseJsonObject } from "../src/utils/json";

const request: ChatRequest = {
  model: "demo-model",
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
          id: "call_previous|fc_previous",
          name: "read_file",
          arguments: {
            path: "README.md",
          },
        },
      ],
      model: "demo-model",
      usage: undefined,
      stopReason: "toolUse",
      errorMessage: undefined,
    },
    {
      role: "toolResult",
      toolCallId: "call_previous|fc_previous",
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

test("OpenAI Responses transport maps requests and non-stream responses", async () => {
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
      output: [
        {
          type: "message",
          content: [
            {
              type: "output_text",
              text: "hello",
            },
          ],
        },
        {
          type: "function_call",
          id: "fc_next",
          call_id: "call_next",
          name: "search",
          arguments: "{\"query\":\"abc\"}",
        },
      ],
      status: "completed",
      usage: {
        input_tokens: 10,
        output_tokens: 2,
        total_tokens: 12,
        input_tokens_details: {
          cached_tokens: 4,
        },
      },
    });
  };

  try {
    const transport = createOpenAIResponsesTransport({
      apiKey: "test-key",
      baseUrl: "https://example.test/v1/",
    });
    const response = await transport.complete(request);

    assert.equal(requestedUrl, "https://example.test/v1/responses");
    assert.equal(new Headers(requestedInit?.headers).get("authorization"), "Bearer test-key");
    assert.deepEqual(parseJsonObject(String(requestedInit?.body), "request body"), {
      model: "demo-model",
      input: [
        {
          role: "system",
          content: "You are concise.",
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "hello",
            },
          ],
        },
        {
          type: "message",
          role: "assistant",
          status: "completed",
          id: "msg_0",
          content: [
            {
              type: "output_text",
              text: "prior",
              annotations: [],
            },
          ],
        },
        {
          type: "function_call",
          call_id: "call_previous",
          id: "fc_previous",
          name: "read_file",
          arguments: "{\"path\":\"README.md\"}",
        },
        {
          type: "function_call_output",
          call_id: "call_previous",
          output: "ok",
        },
      ],
      store: false,
      tools: [
        {
          type: "function",
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
          strict: false,
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
        id: "call_next|fc_next",
        name: "search",
        arguments: {
          query: "abc",
        },
      },
    ]);
    assert.equal(response.message.stopReason, "toolUse");
    assert.deepEqual(response.message.usage, {
      inputTokens: 10,
      outputTokens: 2,
      totalTokens: 12,
      inputCacheHitTokens: 4,
      inputCacheMissTokens: 6,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OpenAI Responses transport streams text deltas, tool calls, and final response", async () => {
  const originalFetch = globalThis.fetch;
  const sse = [
    `data: ${JSON.stringify({
      type: "response.output_item.added",
      item: {
        type: "message",
      },
    })}`,
    "",
    `data: ${JSON.stringify({
      type: "response.output_text.delta",
      delta: "he",
    })}`,
    "",
    `data: ${JSON.stringify({
      type: "response.output_text.delta",
      delta: "llo",
    })}`,
    "",
    `data: ${JSON.stringify({
      type: "response.output_item.added",
      item: {
        type: "function_call",
        id: "fc_stream",
        call_id: "call_stream",
        name: "search",
        arguments: "",
      },
    })}`,
    "",
    `data: ${JSON.stringify({
      type: "response.function_call_arguments.delta",
      delta: "{\"query\"",
    })}`,
    "",
    `data: ${JSON.stringify({
      type: "response.function_call_arguments.delta",
      delta: ":\"abc\"}",
    })}`,
    "",
    `data: ${JSON.stringify({
      type: "response.output_item.done",
      item: {
        type: "function_call",
        id: "fc_stream",
        call_id: "call_stream",
        name: "search",
        arguments: "{\"query\":\"abc\"}",
      },
    })}`,
    "",
    `data: ${JSON.stringify({
      type: "response.completed",
      response: {
        status: "completed",
        usage: {
          input_tokens: 5,
          output_tokens: 3,
          total_tokens: 8,
          input_tokens_details: {
            cached_tokens: 2,
          },
        },
      },
    })}`,
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
    const transport = createOpenAIResponsesTransport({
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
      id: "call_stream|fc_stream",
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
        id: "call_stream|fc_stream",
        name: "search",
        arguments: {
          query: "abc",
        },
      },
    ]);
    assert.equal(doneEvent.response.message.stopReason, "toolUse");
    assert.deepEqual(doneEvent.response.message.usage, {
      inputTokens: 5,
      outputTokens: 3,
      totalTokens: 8,
      inputCacheHitTokens: 2,
      inputCacheMissTokens: 3,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
