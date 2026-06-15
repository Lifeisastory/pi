import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { loadConfig } from "../src/config/config";

test("loadConfig reads api from config and supports environment override", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "chatrealm-config-"));
  const configPath = join(cwd, "chatrealm.config.json");

  try {
    await writeFile(
      configPath,
      `${JSON.stringify({
        api: "openai-completions",
        apiKey: "file-key",
        baseUrl: "https://example.test",
        model: "file-model",
        cwd: "file-cwd",
      })}\n`,
      "utf8",
    );

    const config = loadConfig({
      cwd,
      env: {
        CHATREALM_CONFIG: configPath,
      },
    });

    assert.equal(config.api, "openai-completions");
    assert.equal(config.apiKey, "file-key");
    assert.equal(config.baseUrl, "https://example.test");
    assert.equal(config.model, "file-model");
    assert.equal(config.cwd, "file-cwd");

    const overridden = loadConfig({
      cwd,
      env: {
        CHATREALM_API: "anthropic-messages",
        CHATREALM_CONFIG: configPath,
      },
    });

    assert.equal(overridden.api, "anthropic-messages");
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("loadConfig rejects missing api", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "chatrealm-config-"));
  const configPath = join(cwd, "chatrealm.config.json");

  try {
    await writeFile(
      configPath,
      `${JSON.stringify({
        apiKey: "file-key",
      })}\n`,
      "utf8",
    );

    assert.throws(
      () =>
        loadConfig({
          cwd,
          env: {
            CHATREALM_CONFIG: configPath,
          },
        }),
      /Missing api/,
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("loadConfig rejects unsupported api", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "chatrealm-config-"));
  const configPath = join(cwd, "chatrealm.config.json");

  try {
    await writeFile(
      configPath,
      `${JSON.stringify({
        api: "openai-compatible",
      })}\n`,
      "utf8",
    );

    assert.throws(
      () =>
        loadConfig({
          cwd,
          env: {
            CHATREALM_CONFIG: configPath,
          },
        }),
      /Unsupported api/,
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
