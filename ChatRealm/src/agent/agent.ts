import type { ChatTransport } from "../ai/types.js";
import type { ToolRegistry } from "../tools/registry.js";

export interface RunAgentOptions {
    prompt: string;
    cwd: string;
    model: string;
    transport: ChatTransport;
    tools: ToolRegistry;
}