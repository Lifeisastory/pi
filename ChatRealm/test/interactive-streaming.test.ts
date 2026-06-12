import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

test("chatrealm interactive mode writes streaming chunks before the response completes", { timeout: 5_000 }, async () => {
  let requestCount = 0;
  const server = createServer((request, response) => {
    requestCount += 1;
    void handleStreamingRequest(request, response);
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const address = server.address();

  if (address === null || typeof address === "string") {
    throw new Error("Expected TCP server address");
  }

  const sessionCwd = await mkdtemp(join(tmpdir(), "chatrealm-stream-"));
  const firstSeenAt: { value: number | undefined } = { value: undefined };
  const secondSeenAt: { value: number | undefined } = { value: undefined };
  let wroteExit = false;
  const start = Date.now();
  let stdout = "";
  let stderr = "";

  try {
    const child = spawn(process.execPath, ["bin/chatrealm.mjs"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        CHATREALM_API_KEY: "test-key",
        CHATREALM_BASE_URL: `http://127.0.0.1:${address.port}`,
        CHATREALM_CONFIG: join(sessionCwd, "missing.config.json"),
        CHATREALM_CWD: sessionCwd,
        CHATREALM_MODEL: "demo-model",
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;

      if (stdout.includes("first") && firstSeenAt.value === undefined) {
        firstSeenAt.value = Date.now() - start;
      }

      if (stdout.includes("second") && secondSeenAt.value === undefined) {
        secondSeenAt.value = Date.now() - start;
      }

      if (
        !wroteExit &&
        stdout.includes("second") &&
        countOccurrences(stdout, "chatrealm> ") >= 2
      ) {
        wroteExit = true;
        child.stdin.write("/exit\n");
      }
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.stdin.write("hello\n");

    const [exitCode] = await waitForExit(child, 3_000, () => {
      child.kill();
      return [
        "Timed out waiting for chatrealm to exit.",
        `Requests: ${requestCount}`,
        `stdout: ${stdout}`,
        `stderr: ${stderr}`,
      ].join("\n");
    });

    assert.equal(exitCode, 0, stderr);
    assert.match(stdout, /first/);
    assert.match(stdout, /second/);
    assert.notEqual(firstSeenAt.value, undefined);
    assert.notEqual(secondSeenAt.value, undefined);

    if (firstSeenAt.value === undefined || secondSeenAt.value === undefined) {
      throw new Error("Expected streaming markers");
    }

    assert.ok(
      secondSeenAt.value - firstSeenAt.value >= 150,
      `Expected delayed streaming chunks, got stdout: ${stdout}`,
    );
  } finally {
    server.close();
    await rm(sessionCwd, { recursive: true, force: true });
  }
});

async function handleStreamingRequest(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  if (request.url !== "/chat/completions") {
    response.writeHead(404);
    response.end();
    return;
  }

  await readRequestBody(request);
  response.writeHead(200, {
    "cache-control": "no-cache",
    connection: "keep-alive",
    "content-type": "text/event-stream",
  });
  response.write(
    `data: ${JSON.stringify({
      choices: [
        {
          delta: {
            content: "first",
          },
          finish_reason: null,
        },
      ],
      usage: null,
    })}\n\n`,
  );
  await delay(250);
  response.write(
    `data: ${JSON.stringify({
      choices: [
        {
          delta: {
            content: " second",
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 1,
        completion_tokens: 2,
        total_tokens: 3,
      },
    })}\n\n`,
  );
  await delay(50);
  response.end("data: [DONE]\n\n");
}

async function readRequestBody(request: IncomingMessage): Promise<void> {
  for await (const chunk of request) {
    void chunk;
  }
}

function waitForExit(
  child: ReturnType<typeof spawn>,
  timeoutMs: number,
  getTimeoutMessage: () => string,
): Promise<[number | null, NodeJS.Signals | null]> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(getTimeoutMessage()));
    }, timeoutMs);

    child.once("exit", (code, signal) => {
      clearTimeout(timeout);
      resolve([code, signal]);
    });
  });
}

function countOccurrences(text: string, query: string): number {
  let count = 0;
  let index = text.indexOf(query);

  while (index !== -1) {
    count += 1;
    index = text.indexOf(query, index + query.length);
  }

  return count;
}
