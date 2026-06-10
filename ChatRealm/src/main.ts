import { appendUserMessage, createAgentState } from "./agent/state";
import { buildDefaultSystemPrompt } from "./agent/prompt";
import { runAgentLoop } from "./agent/agent-loop";
import { createOpenAICompatibleTransport } from "./ai/openai-compatible";
import type { AssistantMessage } from "./ai/types";
import { getHelpText, parseArgs } from "./cli/args";
import { loadConfig } from "./config/config";
import { createDefaultToolRegistry } from "./tools/registry";
import { loadSessionMessages, saveSessionMessages } from "./session/store";

const OPENAI_COMPATIBLE_PROVIDER = "openai-compatible";
const DEFAULT_MODEL = "gpt-4.1-mini";

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));

  if (parsed.help) {
    console.log(getHelpText());
    return;
  }

  if (parsed.prompt === undefined) {
    throw new Error("Missing prompt");
  }

  const config = loadConfig();


  const provider = parsed.provider ?? OPENAI_COMPATIBLE_PROVIDER;

  if (provider !== OPENAI_COMPATIBLE_PROVIDER) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  const apiKey = config.apiKey;

  if (apiKey === undefined) {
    throw new Error(
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

  state.messages.push(...await loadSessionMessages({ cwd }));

  appendUserMessage(state, parsed.prompt);


  const result = await runAgentLoop({
    state,
    transport,
    tools,
  });

  await saveSessionMessages({ cwd }, result.state.messages);

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
