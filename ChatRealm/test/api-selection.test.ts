import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import {
  createServer,
  type IncomingHttpHeaders,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import type { ChatApi } from "../src/ai/types";
import { parseJsonObject } from "../src/utils/json";

interface ApiSelectionScenario {
  api: ChatApi;
  endpoint: string;
  expectedText: string;
  responseBody: Record<string, unknown>;
}

interface RecordedRequest {
  method: string | undefined;
  url: string | undefined;
  headers: IncomingHttpHeaders;
  body: string;
}

const scenarios: ApiSelectionScenario[] = [
  {
    api: "openai-completions",
    endpoint: "/chat/completions",
    expectedText: "reply from completions",
    responseBody: {
      choices: [
        {
          finish_reason: "stop",
          message: {
            content: "reply from completions",
          },
        },
      ],
      usage: {
        prompt_tokens: 1,
        completion_tokens: 2,
        total_tokens: 3,
      },
    },
  },
  {
    api: "openai-responses",
    endpoint: "/responses",
    expectedText: "reply from responses",
    responseBody: {
      output: [
        {
          type: "message",
          content: [
            {
              type: "output_text",
              text: "reply from responses",
            },
          ],
        },
      ],
      status: "completed",
      usage: {
        input_tokens: 1,
        output_tokens: 2,
        total_tokens: 3,
      },
    },
  },
  {
    api: "anthropic-messages",
    endpoint: "/messages",
    expectedText: "reply from anthropic",
    responseBody: {
      content: [
        {
          type: "text",
          text: "reply from anthropic",
        },
      ],
      stop_reason: "end_turn",
      usage: {
        input_tokens: 1,
        output_tokens: 2,
      },
    },
  },
];

for (const scenario of scenarios) {
  test(`chatrealm prompt mode selects ${scenario.api} from config`, { timeout: 7_500 }, async () => {
    const requests: RecordedRequest[] = [];
    const server = createServer((request, response) => {
      void handleRequest(scenario, requests, request, response);
    });

    server.listen(0, "127.0.0.1");
    await once(server, "listening");

    const address = server.address();

    if (address === null || typeof address === "string") {
      throw new Error("Expected TCP server address");
    }

    const cwd = await mkdtemp(join(tmpdir(), "chatrealm-api-selection-"));
    const configPath = join(cwd, "chatrealm.config.json");

    try {
      await writeFile(
        configPath,
        `${JSON.stringify({
          api: scenario.api,
          apiKey: "test-key",
          baseUrl: `http://127.0.0.1:${address.port}`,
          cwd,
          model: "demo-model",
        })}\n`,
        "utf8",
      );

      const result = await runChatRealmPrompt(configPath);

      assert.equal(result.exitCode, 0, result.stderr);
      assert.match(result.stdout, new RegExp(scenario.expectedText));
      assert.equal(requests.length, 1);

      const [request] = requests;

      assert.notEqual(request, undefined);

      if (request === undefined) {
        throw new Error("Expected one recorded request");
      }

      assert.equal(request.method, "POST");
      assert.equal(request.url, scenario.endpoint);
      assert.equal(readHeader(request.headers, "content-type"), "application/json");
      assert.equal(parseJsonObject(request.body, "provider request body").model, "demo-model");

      if (scenario.api === "anthropic-messages") {
        assert.equal(readHeader(request.headers, "x-api-key"), "test-key");
        assert.equal(readHeader(request.headers, "anthropic-version"), "2023-06-01");
      } else {
        assert.equal(readHeader(request.headers, "authorization"), "Bearer test-key");
      }
    } finally {
      server.close();
      await rm(cwd, { recursive: true, force: true });
    }
  });
}

async function handleRequest(
  scenario: ApiSelectionScenario,
  requests: RecordedRequest[],
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const body = await readRequestBody(request);

  requests.push({
    method: request.method,
    url: request.url,
    headers: request.headers,
    body,
  });

  if (request.url !== scenario.endpoint) {
    response.writeHead(404);
    response.end();
    return;
  }

  response.writeHead(200, {
    "content-type": "application/json",
  });
  response.end(JSON.stringify(scenario.responseBody));
}

async function runChatRealmPrompt(
  configPath: string,
): Promise<{ exitCode: number | null; stdout: string; stderr: string }> {
  const child = spawn(process.execPath, ["bin/chatrealm.mjs", "-p", "hello"], {
    cwd: process.cwd(),
    env: {
      ...createCleanEnv(),
      CHATREALM_CONFIG: configPath,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";

  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk: string) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk: string) => {
    stderr += chunk;
  });

  const [exitCode] = await waitForExit(child, 5_000, () =>
    [
      "Timed out waiting for prompt mode to exit.",
      `stdout: ${stdout}`,
      `stderr: ${stderr}`,
    ].join("\n"),
  );

  return {
    exitCode,
    stdout,
    stderr,
  };
}

function createCleanEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined && !key.startsWith("CHATREALM_")) {
      env[key] = value;
    }
  }

  return env;
}

async function readRequestBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

function readHeader(
  headers: IncomingHttpHeaders,
  name: string,
): string | undefined {
  const value = headers[name];

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return value;
}

function waitForExit(
  child: ReturnType<typeof spawn>,
  timeoutMs: number,
  getTimeoutMessage: () => string,
): Promise<[number | null, NodeJS.Signals | null]> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(getTimeoutMessage()));
    }, timeoutMs);

    child.once("exit", (code, signal) => {
      clearTimeout(timeout);
      resolve([code, signal]);
    });
  });
}
