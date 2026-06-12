import type { AssistantMessage, ChatTransport, Message } from "../ai/types";
import type { ToolRegistry } from "../tools/registry";
import { saveSessionMessages } from "../session/store";
import { toUserFacingError } from "../utils/errors";
import { runAgentLoop } from "./agent-loop";
import { buildDefaultSystemPrompt } from "./prompt";
import { appendUserMessage, createAgentState } from "./state";

export interface RunAgentPromptOptions {
  prompt: string;
  cwd: string;
  model: string;
  transport: ChatTransport;
  tools: ToolRegistry;
  messages: Message[];
}

export interface RunAgentPromptResult {
  messages: Message[];
  finalMessage: AssistantMessage;
}

export async function runAgentPrompt(
  options: RunAgentPromptOptions,
): Promise<RunAgentPromptResult> {
  const state = createAgentState({
    cwd: options.cwd,
    model: options.model,
    systemPrompt: buildDefaultSystemPrompt(),
  });

  state.messages.push(...options.messages);
  appendUserMessage(state, options.prompt);

  let result;

  try {
    result = await runAgentLoop({
      state,
      transport: options.transport,
      tools: options.tools,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Agent loop reached max turns")
    ) {
      throw toUserFacingError("agent", error, "Agent loop failed");
    }

    throw toUserFacingError("provider", error, "Provider request failed");
  }

  try {
    await saveSessionMessages({ cwd: options.cwd }, result.state.messages);
  } catch (error) {
    throw toUserFacingError("session", error, "Failed to save session");
  }

  return {
    messages: result.state.messages,
    finalMessage: result.finalMessage,
  };
}

export function renderAssistantText(message: AssistantMessage): string {
  return message.content
    .filter((content) => content.type === "text")
    .map((content) => content.text)
    .join("\n");
}
