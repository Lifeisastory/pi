import { appendUserMessage, createAgentState } from "./agent/state";
import { buildDefaultSystemPrompt } from "./agent/prompt";
import { runAgentLoop } from "./agent/agent-loop";
import { createOpenAICompatibleTransport } from "./ai/openai-compatible";
import type { AssistantMessage } from "./ai/types";
import { getHelpText, parseArgs } from "./cli/args";
import { loadConfig } from "./config/config";
import { createDefaultToolRegistry } from "./tools/registry";
import { loadSessionMessages, saveSessionMessages } from "./session/store";
import {
  UserFacingError,
  formatCliError,
  toUserFacingError,
} from "./utils/errors";

const OPENAI_COMPATIBLE_PROVIDER = "openai-compatible";
const DEFAULT_MODEL = "gpt-4.1-mini";

main().catch((error: unknown) => {
  const formatted = formatCliError(error);
  console.error(formatted.message);
  process.exitCode = formatted.exitCode;
});
async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));

  if (parsed.help) {
    console.log(getHelpText());
    return;
  }

  if (parsed.prompt === undefined) {
    throw new UserFacingError("usage", "Missing prompt");
  }

  const config = loadConfig();


  const provider = parsed.provider ?? OPENAI_COMPATIBLE_PROVIDER;

  if (provider !== OPENAI_COMPATIBLE_PROVIDER) {
    throw new UserFacingError("usage", `Unsupported provider: ${provider}`);
  }

  const apiKey = config.apiKey;

  if (apiKey === undefined) {
    throw new UserFacingError(
      "config",
      "Missing API key. Set CHATREALM_API_KEY or apiKey in chatrealm.config.json",
    );
  }

  const model = parsed.model ?? config.model ?? DEFAULT_MODEL;
  const cwd = parsed.cwd ?? config.cwd;


  const transport = createOpenAICompatibleTransport({
    apiKey,
    baseUrl: config.baseUrl,
  });

  const tools = createDefaultToolRegistry();


  const state = createAgentState({
    cwd,
    model,
    systemPrompt: buildDefaultSystemPrompt(),
  });

  let savedMessages;

  try {
    savedMessages = await loadSessionMessages({ cwd });
  } catch (error) {
    throw toUserFacingError("session", error, "Failed to load session");
  }

  state.messages.push(...savedMessages);

  appendUserMessage(state, parsed.prompt);


  let result;

  try {
    result = await runAgentLoop({
      state,
      transport,
      tools,
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
    await saveSessionMessages({ cwd }, result.state.messages);
  } catch (error) {
    throw toUserFacingError("session", error, "Failed to save session");
  }

  const text = renderAssistantText(result.finalMessage);

  if (text !== "") {
    console.log(text);
  }

}

function renderAssistantText(message: AssistantMessage): string {
  return message.content
    .filter((content) => content.type === "text")
    .map((content) => content.text)
    .join("\n");
}
