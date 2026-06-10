import type {
    JsonObject,
    ToolDefinition,
} from "../ai/types";

export interface ToolContext {
    cwd: string;
}

export interface ToolResult {
    content: string;
    isError: boolean;
}

export interface AgentTool {
    definition: ToolDefinition;
    execute(args: JsonObject, context: ToolContext): Promise<ToolResult>;
}
