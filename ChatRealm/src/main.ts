import {
  renderAssistantText,
  runAgentPrompt,
} from "./agent/run-prompt";
import { createOpenAICompatibleTransport } from "./ai/openai-compatible";
import type { ChatTransport, Message } from "./ai/types";
import { getHelpText, parseArgs, type ParsedArgs } from "./cli/args";
import { startInteractiveSession } from "./cli/interactive";
import { loadConfig } from "./config/config";
import { loadSessionMessages } from "./session/store";
import {
  createDefaultToolRegistry,
  type ToolRegistry,
} from "./tools/registry";
import {
  UserFacingError,
  formatCliError,
  toUserFacingError,
} from "./utils/errors";

const OPENAI_COMPATIBLE_PROVIDER = "openai-compatible";
const DEFAULT_MODEL = "gpt-4.1-mini";

interface Runtime {
  cwd: string;
  model: string;
  apiKey: string | undefined;
  baseUrl: string | undefined;
  tools: ToolRegistry;
}

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

  const runtime = createRuntime(parsed);
  const savedMessages = await loadSavedMessages(runtime.cwd);

  if (parsed.prompt === undefined) {
    await startInteractiveSession({
      ...runtime,
      createTransport: () => createTransport(runtime),
      messages: savedMessages,
    });
    return;
  }

  const result = await runAgentPrompt({
    ...runtime,
    transport: createTransport(runtime),
    messages: savedMessages,
    prompt: parsed.prompt,
  });
  const text = renderAssistantText(result.finalMessage);

  if (text !== "") {
    console.log(text);
  }
}

function createRuntime(parsed: ParsedArgs): Runtime {
  const config = loadConfig();
  const provider = parsed.provider ?? OPENAI_COMPATIBLE_PROVIDER;

  if (provider !== OPENAI_COMPATIBLE_PROVIDER) {
    throw new UserFacingError("usage", `Unsupported provider: ${provider}`);
  }

  const model = parsed.model ?? config.model ?? DEFAULT_MODEL;
  const cwd = parsed.cwd ?? config.cwd;
  const tools = createDefaultToolRegistry();

  return {
    cwd,
    model,
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    tools,
  };
}

function createTransport(runtime: Runtime): ChatTransport {
  const apiKey = runtime.apiKey;

  if (apiKey === undefined || apiKey.trim() === "") {
    throw new UserFacingError(
      "config",
      "Missing API key. Set CHATREALM_API_KEY or apiKey in chatrealm.config.json",
    );
  }

  return createOpenAICompatibleTransport({
    apiKey,
    baseUrl: runtime.baseUrl,
  });
}

async function loadSavedMessages(cwd: string): Promise<Message[]> {
  try {
    return await loadSessionMessages({ cwd });
  } catch (error) {
    throw toUserFacingError("session", error, "Failed to load session");
  }
}
