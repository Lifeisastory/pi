import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  getSessionPath,
  loadSessionMessages,
  saveSessionMessages,
} from "./src/session/store";

const cwd = await mkdtemp(join(tmpdir(), "chatrealm-session-"));

try {
  const initial = await loadSessionMessages({ cwd });

  if (initial.length !== 0) {
    throw new Error("Expected empty initial session");
  }

  await saveSessionMessages({ cwd }, [
    {
      role: "user",
      content: "hello",
    },
  ]);

  const loaded = await loadSessionMessages({ cwd });

  if (loaded.length !== 1 || loaded[0]?.role !== "user") {
    throw new Error("Expected saved user message");
  }

  if (!getSessionPath({ cwd }).endsWith(".chatrealm/sessions/default.json")) {
    throw new Error("Unexpected session path");
  }

  console.log("todo-012 smoke ok");
} finally {
  await rm(cwd, { recursive: true, force: true });
}
