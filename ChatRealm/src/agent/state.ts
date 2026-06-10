import type {
    AssistantMessage,
    Message,
    ToolResultMessage,
    UserMessage,
} from "../ai/types";
import type { ToolResult } from "../tools/types";
import { buildDefaultSystemPrompt } from "./prompt";

function touch(state: AgentState): void {
    state.run.updatedAt = new Date().toISOString();
}

export interface CreateAgentStateOptions {
    cwd: string;
    model: string;
    systemPrompt: string | undefined;
    maxTurns?: number;
}

export interface AgentRunMetadata {
    turnCount: number;
    maxTurns: number;
    startedAt: string;
    updatedAt: string;
}

export interface AgentState {
    cwd: string;
    model: string;
    systemPrompt: string | undefined;
    messages: Message[];
    run: AgentRunMetadata;
}

export function createAgentState(options: CreateAgentStateOptions): AgentState {
    const now = new Date().toISOString();

    return {
        cwd: options.cwd,
        model: options.model,
        systemPrompt: options.systemPrompt,
        messages: [],
        run: {
            turnCount: 0,
            maxTurns: options.maxTurns ?? 10,
            startedAt: now,
            updatedAt: now,
        },
    };
}

export function createDefaultAgentState(
    cwd: string,
    model: string,
): AgentState {
    return createAgentState({
        cwd,
        model,
        systemPrompt: buildDefaultSystemPrompt(),
    });
}

export function appendUserMessage(state: AgentState, content: string): void {
    const message: UserMessage = {
        role: "user",
        content,
    };

    state.messages.push(message);
    touch(state);
}

export function appendAssistantMessage(
    state: AgentState,
    message: AssistantMessage,
): void {
    state.messages.push(message);
    touch(state);
}

export function appendToolResultMessage(
    state: AgentState,
    toolCallId: string,
    toolName: string,
    result: ToolResult,
): void {
    const message: ToolResultMessage = {
        role: "toolResult",
        toolCallId,
        toolName,
        content: result.content,
        isError: result.isError,
    };

    state.messages.push(message);
    touch(state);
}

export function incrementTurn(state: AgentState): void {
    state.run.turnCount += 1;
    touch(state);
}

export function hasRemainingTurns(state: AgentState): boolean {
    return state.run.turnCount < state.run.maxTurns;
}
