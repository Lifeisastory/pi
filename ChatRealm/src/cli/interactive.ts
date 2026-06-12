import { createInterface } from "node:readline/promises";

import type { ChatTransport, Message } from "../ai/types";
import { renderAssistantText, runAgentPrompt } from "../agent/run-prompt";
import type { ToolRegistry } from "../tools/registry";
import { formatCliError } from "../utils/errors";

export interface InteractiveSessionOptions {
  cwd: string;
  model: string;
  createTransport: () => ChatTransport;
  tools: ToolRegistry;
  messages: Message[];
}

type SlashCommandResult = "continue" | "exit";

export async function startInteractiveSession(
  options: InteractiveSessionOptions,
): Promise<void> {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  let messages = [...options.messages];

  console.log("ChatRealm interactive mode. Type /help for commands.");

  try {
    while (true) {
      const line = await readline.question("chatrealm> ");
      const input = line.trim();

      if (input === "") {
        continue;
      }

      if (input.startsWith("/")) {
        if (handleSlashCommand(input) === "exit") {
          return;
        }

        continue;
      }

      try {
        let wroteStreamedText = false;
        const result = await runAgentPrompt({
          ...options,
          transport: options.createTransport(),
          messages,
          prompt: input,
          onTextDelta: (delta) => {
            wroteStreamedText = true;
            process.stdout.write(delta);
          },
        });
        const text = renderAssistantText(result.finalMessage);

        messages = result.messages;

        if (wroteStreamedText) {
          process.stdout.write("\n");
        } else if (text !== "") {
          console.log(text);
        }
      } catch (error) {
        const formatted = formatCliError(error);
        console.error(formatted.message);
      }
    }
  } finally {
    readline.close();
  }
}

function handleSlashCommand(input: string): SlashCommandResult {
  const command = input.split(/\s+/, 1)[0];

  switch (command) {
    case "/help":
      console.log(getSlashCommandHelpText());
      return "continue";
    case "/exit":
    case "/quit":
      return "exit";
    default:
      console.error(`Unknown command: ${command}. Type /help for commands.`);
      return "continue";
  }
}

function getSlashCommandHelpText(): string {
  return [
    "Slash commands:",
    "  /help   Show commands",
    "  /exit   Exit ChatRealm",
    "  /quit   Exit ChatRealm",
  ].join("\n");
}
