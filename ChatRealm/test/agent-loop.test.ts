import assert from "node:assert/strict";
import test from "node:test";

import type {
  AssistantMessage,
  ChatRequest,
  ChatResponse,
  ChatTransport,
  JsonObject,
} from "../src/ai/types";
import { runAgentLoop } from "../src/agent/agent-loop";
import { appendUserMessage, createAgentState } from "../src/agent/state";
import { createToolRegistry } from "../src/tools/registry";
import type { AgentTool } from "../src/tools/types";

function textMessage(text: string): AssistantMessage {
  return {
    role: "assistant",
    content: [{ type: "text", text }],
    model: "demo-model",
    usage: undefined,
    stopReason: "stop",
    errorMessage: undefined,
  };
}

function toolCallMessage(name: string, args: JsonObject = {}): AssistantMessage {
  return {
    role: "assistant",
    content: [
      {
        type: "toolCall",
        id: "call-1",
        name,
        arguments: args,
      },
    ],
    model: "demo-model",
    usage: undefined,
    stopReason: "toolUse",
    errorMessage: undefined,
  };
}

function createState(maxTurns = 10) {
  const state = createAgentState({
    cwd: process.cwd(),
    model: "demo-model",
    systemPrompt: "You are a test agent.",
    maxTurns,
  });

  appendUserMessage(state, "hello");
  return state;
}

function createTransport(messages: AssistantMessage[]): ChatTransport {
  let index = 0;

  return {
    complete: async (_request: ChatRequest): Promise<ChatResponse> => {
      const message = messages[index];

      if (message === undefined) {
        throw new Error("No fake response available");
      }

      index += 1;
      return { message };
    },
  };
}

const echoTool: AgentTool = {
  definition: {
    name: "echo",
    description: "Echo test tool",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  execute: async () => ({
    content: "tool ok",
    isError: false,
  }),
};

test("runAgentLoop returns a final answer from a fake provider", async () => {
  const state = createState();
  const result = await runAgentLoop({
    state,
    transport: createTransport([textMessage("done")]),
    tools: createToolRegistry(),
  });

  assert.equal(result.finalMessage.content[0]?.type, "text");
  assert.equal(state.run.turnCount, 1);
  assert.equal(state.messages.at(-1), result.finalMessage);
});

test("runAgentLoop executes tool calls before returning a final answer", async () => {
  const state = createState();
  const result = await runAgentLoop({
    state,
    transport: createTransport([toolCallMessage("echo"), textMessage("done")]),
    tools: createToolRegistry([echoTool]),
  });

  const toolResult = state.messages.find(
    (message) => message.role === "toolResult",
  );

  assert.equal(toolResult?.role, "toolResult");
  assert.equal(toolResult?.content, "tool ok");
  assert.equal(toolResult?.isError, false);
  assert.equal(result.finalMessage, state.messages.at(-1));
});

test("runAgentLoop reports max-turn exhaustion", async () => {
  const state = createState(1);

  await assert.rejects(
    () =>
      runAgentLoop({
        state,
        transport: createTransport([toolCallMessage("echo")]),
        tools: createToolRegistry([echoTool]),
      }),
    /Agent loop reached max turns \(1\) before a final answer/,
  );
});

test("runAgentLoop stores tool execution failures as tool results", async () => {
  const failingTool: AgentTool = {
    definition: {
      ...echoTool.definition,
      name: "fail",
    },
    execute: async () => {
      throw new Error("boom");
    },
  };
  const state = createState();
  const result = await runAgentLoop({
    state,
    transport: createTransport([toolCallMessage("fail"), textMessage("done")]),
    tools: createToolRegistry([failingTool]),
  });
  const toolResult = state.messages.find(
    (message) => message.role === "toolResult",
  );

  assert.equal(toolResult?.role, "toolResult");
  assert.equal(toolResult?.content, "Tool error: boom");
  assert.equal(toolResult?.isError, true);
  assert.equal(result.finalMessage.content[0]?.type, "text");
});
