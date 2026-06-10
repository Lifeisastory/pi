import type { ChatTransport } from "../ai/types";
import type { ToolRegistry } from "../tools/registry";

export interface RunAgentOptions {
    prompt: string;
    cwd: string;
    model: string;
    transport: ChatTransport;
    tools: ToolRegistry;
}
