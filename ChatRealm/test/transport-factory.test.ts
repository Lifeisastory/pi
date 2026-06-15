import assert from "node:assert/strict";
import test from "node:test";

import { createChatTransport } from "../src/ai/transport-factory";
import type { ChatRequest } from "../src/ai/types";
import { parseJsonObject } from "../src/utils/json";

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

test("createChatTransport selects the OpenAI completions transport", async () => {
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
      choices: [
        {
          finish_reason: "stop",
          message: {
            content: "hello",
          },
        },
      ],
      usage: {
        prompt_tokens: 1,
        completion_tokens: 1,
        total_tokens: 2,
      },
    });
  };

  try {
    const transport = createChatTransport({
      api: "openai-completions",
      apiKey: "test-key",
      baseUrl: "https://example.test/v1/",
    });
    const response = await transport.complete(request);

    assert.equal(requestedUrl, "https://example.test/v1/chat/completions");
    assert.equal(new Headers(requestedInit?.headers).get("authorization"), "Bearer test-key");
    assert.deepEqual(parseJsonObject(String(requestedInit?.body), "request body"), {
      model: "demo-model",
      messages: [
        {
          role: "user",
          content: "hello",
        },
      ],
    });
    assert.deepEqual(response.message.content, [
      {
        type: "text",
        text: "hello",
      },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("createChatTransport selects the OpenAI responses transport", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl: string | undefined;

  globalThis.fetch = async (
    input: string | URL | Request,
  ): Promise<Response> => {
    requestedUrl = input instanceof Request ? input.url : input.toString();

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
      ],
      status: "completed",
    });
  };

  try {
    const transport = createChatTransport({
      api: "openai-responses",
      apiKey: "test-key",
      baseUrl: "https://example.test/v1/",
    });
    const response = await transport.complete(request);

    assert.equal(requestedUrl, "https://example.test/v1/responses");
    assert.deepEqual(response.message.content, [
      {
        type: "text",
        text: "hello",
      },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("createChatTransport selects the Anthropic messages transport", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl: string | undefined;

  globalThis.fetch = async (
    input: string | URL | Request,
  ): Promise<Response> => {
    requestedUrl = input instanceof Request ? input.url : input.toString();

    return Response.json({
      content: [
        {
          type: "text",
          text: "hello",
        },
      ],
      stop_reason: "end_turn",
    });
  };

  try {
    const transport = createChatTransport({
      api: "anthropic-messages",
      apiKey: "test-key",
      baseUrl: "https://example.test/v1/",
    });
    const response = await transport.complete(request);

    assert.equal(requestedUrl, "https://example.test/v1/messages");
    assert.deepEqual(response.message.content, [
      {
        type: "text",
        text: "hello",
      },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
