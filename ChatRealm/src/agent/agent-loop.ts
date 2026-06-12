import type {
    AssistantMessage,
    ChatRequest,
    ChatResponse,
    ChatStreamEvent,
    ChatTransport,
    ToolCallContent,
} from "../ai/types";

import type { ToolRegistry } from "../tools/registry";

import {
    appendAssistantMessage,
    appendToolResultMessage,
    hasRemainingTurns,
    incrementTurn,
    type AgentState,
} from "./state";

export interface RunAgentLoopOptions {
    state: AgentState;
    transport: ChatTransport;
    tools: ToolRegistry;
    onTextDelta?: (delta: string) => void;
}

export interface RunAgentLoopResult {
    state: AgentState;
    finalMessage: AssistantMessage;
}

function createChatRequest(
    state: AgentState,
    tools: ToolRegistry,
): ChatRequest {
    return {
        model: state.model,
        systemPrompt: state.systemPrompt,
        messages: state.messages,
        tools: tools.definitions(),
    };
}

function getToolCalls(message: AssistantMessage): ToolCallContent[] {
    return message.content.filter(isToolCallContent);
}

function isToolCallContent(content: AssistantMessage["content"][number]): content is ToolCallContent {
    return content.type === "toolCall";
}

export async function runAgentLoop(
    options: RunAgentLoopOptions,
): Promise<RunAgentLoopResult> {
    const { onTextDelta, state, transport, tools } = options;

    while (hasRemainingTurns(state)) {
        incrementTurn(state);

        const response = await completeChatRequest(
            transport,
            createChatRequest(state, tools),
            onTextDelta,
        );
        const message = response.message;

        appendAssistantMessage(state, message);

        const toolCalls = getToolCalls(message);

        if (toolCalls.length === 0) {
            return {
                state,
                finalMessage: message,
            };
        }

        for (const toolCall of toolCalls) {
            await executeToolCall(state, tools, toolCall);
        }
    }

    throw new Error(`Agent loop reached max turns (${state.run.maxTurns}) before a final answer`);
}

async function completeChatRequest(
    transport: ChatTransport,
    request: ChatRequest,
    onTextDelta: ((delta: string) => void) | undefined,
): Promise<ChatResponse> {
    if (onTextDelta === undefined || transport.stream === undefined) {
        return await transport.complete(request);
    }

    let response: ChatResponse | undefined;

    for await (const event of transport.stream(request)) {
        switch (event.type) {
            case "textDelta":
                onTextDelta(event.delta);
                break;
            case "done":
                response = event.response;
                break;
            case "error":
                throw new Error(event.message);
            case "toolCall":
                break;
        }
    }

    if (response === undefined) {
        throw new Error("Streaming response ended before completion");
    }

    return response;
}

async function executeToolCall(
    state: AgentState,
    tools: ToolRegistry,
    toolCall: ToolCallContent,
): Promise<void> {
    const tool = tools.get(toolCall.name);

    if (tool === undefined) {
        appendToolResultMessage(state, toolCall.id, toolCall.name, {
            content: `Unknown tool: ${toolCall.name}`,
            isError: true,
        });
        return;
    }

    try {
        const result = await tool.execute(toolCall.arguments, {
            cwd: state.cwd,
        });

        appendToolResultMessage(state, toolCall.id, toolCall.name, result);
    } catch (error) {
        appendToolResultMessage(state, toolCall.id, toolCall.name, {
            content: formatToolExecutionError(error),
            isError: true,
        });
    }
}

function formatToolExecutionError(error: unknown): string {
    if (error instanceof Error) {
        return `Tool error: ${error.message}`;
    }

    return `Tool error: ${String(error)}`;
}
