import type { ToolDefinition } from "../ai/types";
import type { AgentTool } from "./types";
import { readFileTool } from "./read-file";
import { searchTool } from "./search";
import { shellTool } from "./shell";
import { writeFileTool } from "./write-file";

export class ToolRegistry {
    private readonly tools = new Map<string, AgentTool>();

    constructor(tools: AgentTool[] = []) {
        for (const tool of tools) {
            this.register(tool);
        }
    }

    register(tool: AgentTool): void {
        const name = tool.definition.name;

        if (name.trim() === "") {
            throw new Error("Tool name cannot be empty");
        }

        if (this.tools.has(name)) {
            throw new Error(`Duplicate tool registered: ${name}`);
        }

        this.tools.set(name, tool);
    }

    get(name: string): AgentTool | undefined {
        return this.tools.get(name);
    }

    require(name: string): AgentTool {
        const tool = this.get(name);

        if (tool === undefined) {
            throw new Error(`Unknown tool: ${name}`);
        }

        return tool;
    }

    list(): AgentTool[] {
        return [...this.tools.values()];
    }

    definitions(): ToolDefinition[] {
        return this.list().map((tool) => tool.definition);
    }
}

export function createToolRegistry(tools: AgentTool[] = []): ToolRegistry {
    return new ToolRegistry(tools);
}

export function createDefaultToolRegistry(): ToolRegistry {
    return createToolRegistry([
        readFileTool,
        searchTool,
        writeFileTool,
        shellTool,
    ]);
}
