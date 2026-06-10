import { parseJsonObject } from "../utils/json.js";
import type {
    AssistantContent,
    AssistantMessage,
    ChatRequest,
    ChatResponse,
    ChatTransport,
    JsonObject,
    JsonValue,
    Message,
    StopReason,
    ToolDefinition,
    Usage,
} from "./types.js";

const DEFAULT_BASE_URL = "https://api.openai.com/v1";

export interface OpenAICompatibleOptions {
    apiKey: string;
    baseUrl?: string;
}

interface OpenAIChatCompletionResponse {
    choices: OpenAIChoice[];
    usage?: OpenAIUsage;
}

interface OpenAIChoice {
    finishReason?: string | null;
    message: OpenAIMessage;
}

interface OpenAIMessage {
    content?: string | null;
    toolCalls?: OpenAIToolCall[];
}

interface OpenAIToolCall {
    id?: string;
    type?: string;
    functionName?: string;
    functionArguments?: string;
}

interface OpenAIUsage {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
}

class OpenAICompatibleTransport implements ChatTransport {
    private readonly apiKey: string;
    private readonly baseUrl: string;

    constructor(options: OpenAICompatibleOptions) {
        if (options.apiKey.trim() === "") {
            throw new Error("Missing OpenAI-compatible API key");
        }

        const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;

        this.apiKey = options.apiKey;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    }

    async complete(request: ChatRequest): Promise<ChatResponse> {
        const body: JsonObject = {
            model: request.model,
            messages: toOpenAIMessages(request),
        };

        if (request.tools.length > 0) {
            body.tools = request.tools.map(toOpenAITool);
        }

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                authorization: `Bearer ${this.apiKey}`,
                "content-type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `OpenAI-compatible request failed with ${response.status}: ${errorText}`,
            );
        }

        const responseText = await response.text();
        const json = parseJsonObject(responseText, "OpenAI-compatible response");
        const data = parseChatCompletionResponse(json);
        const choice = data.choices[0];

        if (choice === undefined) {
            throw new Error("OpenAI-compatible response did not include a choice");
        }

        const message: AssistantMessage = {
            role: "assistant",
            content: toAssistantContent(choice.message),
            model: request.model,
            usage: toUsage(data.usage),
            stopReason: toStopReason(choice.finishReason),
            errorMessage: undefined,
        };

        return { message };
    }
}

export function createOpenAICompatibleTransport(
    options: OpenAICompatibleOptions,
): ChatTransport {
    return new OpenAICompatibleTransport(options);
}

function toOpenAIMessages(request: ChatRequest): JsonObject[] {
    const messages: JsonObject[] = [];

    if (request.systemPrompt !== undefined) {
        messages.push({
            role: "system",
            content: request.systemPrompt,
        });
    }

    for (const message of request.messages) {
        switch (message.role) {
            case "user":
                messages.push({
                    role: "user",
                    content: message.content,
                });
                break;

            case "assistant":
                messages.push(toOpenAIAssistantMessage(message));
                break;

            case "toolResult":
                messages.push({
                    role: "tool",
                    tool_call_id: message.toolCallId,
                    content: message.content,
                });
                break;
        }
    }

    return messages;
}

function toOpenAIAssistantMessage(message: AssistantMessage): JsonObject {
    const textParts: string[] = [];
    const toolCalls: JsonValue[] = [];

    for (const content of message.content) {
        if (content.type === "text") {
            textParts.push(content.text);
            continue;
        }

        toolCalls.push({
            id: content.id,
            type: "function",
            function: {
                name: content.name,
                arguments: JSON.stringify(content.arguments),
            },
        });
    }

    const openAIMessage: JsonObject = {
        role: "assistant",
        content: textParts.length > 0 ? textParts.join("\n") : null,
    };

    if (toolCalls.length > 0) {
        openAIMessage.tool_calls = toolCalls;
    }

    return openAIMessage;
}

function toOpenAITool(tool: ToolDefinition): JsonObject {
    return {
        type: "function",
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
        },
    };
}

function parseChatCompletionResponse(
    json: Record<string, unknown>,
): OpenAIChatCompletionResponse {
    const choices = json.choices;

    if (!Array.isArray(choices)) {
        throw new Error("OpenAI-compatible response is missing choices");
    }

    return {
        choices: choices.map(parseChoice),
        usage: parseUsage(json.usage),
    };
}

function parseChoice(value: unknown): OpenAIChoice {
    if (!isRecord(value)) {
        throw new Error("OpenAI-compatible choice must be an object");
    }

    const message = value.message;

    if (!isRecord(message)) {
        throw new Error("OpenAI-compatible choice is missing message");
    }

    const toolCalls = message.tool_calls;

    if (toolCalls !== undefined && !Array.isArray(toolCalls)) {
        throw new Error("OpenAI-compatible tool_calls must be an array");
    }

    return {
        finishReason: readOptionalStringOrNull(value.finish_reason),
        message: {
            content: readOptionalStringOrNull(message.content),
            toolCalls: toolCalls?.map(parseToolCall),
        },
    };
}

function parseToolCall(value: unknown): OpenAIToolCall {
    if (!isRecord(value)) {
        throw new Error("OpenAI-compatible tool call must be an object");
    }

    const fn = value.function;

    if (!isRecord(fn)) {
        throw new Error("OpenAI-compatible tool call is missing function");
    }

    return {
        id: readOptionalStringOrNull(value.id) ?? undefined,
        type: readOptionalStringOrNull(value.type) ?? undefined,
        functionName: readOptionalStringOrNull(fn.name) ?? undefined,
        functionArguments: readOptionalStringOrNull(fn.arguments) ?? undefined,
    };
}

function parseUsage(value: unknown): OpenAIUsage | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (!isRecord(value)) {
        throw new Error("OpenAI-compatible usage must be an object");
    }

    return {
        inputTokens: readOptionalNumber(value.prompt_tokens),
        outputTokens: readOptionalNumber(value.completion_tokens),
        totalTokens: readOptionalNumber(value.total_tokens),
    };
}

function toAssistantContent(message: OpenAIMessage): AssistantContent[] {
    const content: AssistantContent[] = [];

    if (message.content !== undefined && message.content !== null && message.content !== "") {
        content.push({
            type: "text",
            text: message.content,
        });
    }

    for (const toolCall of message.toolCalls ?? []) {
        content.push(toToolCallContent(toolCall));
    }

    return content;
}

function toToolCallContent(toolCall: OpenAIToolCall): AssistantContent {
    if (toolCall.type !== undefined && toolCall.type !== "function") {
        throw new Error(`Unsupported OpenAI-compatible tool call type: ${toolCall.type}`);
    }

    if (toolCall.id === undefined || toolCall.id === "") {
        throw new Error("OpenAI-compatible tool call is missing id");
    }

    if (toolCall.functionName === undefined || toolCall.functionName === "") {
        throw new Error("OpenAI-compatible tool call is missing function name");
    }

    if (toolCall.functionArguments === undefined) {
        throw new Error("OpenAI-compatible tool call is missing function arguments");
    }

    const parsedArguments = parseJsonObject(
        toolCall.functionArguments,
        `OpenAI-compatible tool call ${toolCall.functionName} arguments`,
    );

    return {
        type: "toolCall",
        id: toolCall.id,
        name: toolCall.functionName,
        arguments: toJsonObject(
            parsedArguments,
            `OpenAI-compatible tool call ${toolCall.functionName} arguments`,
        ),
    };
}

function toUsage(usage: OpenAIUsage | undefined): Usage | undefined {
    if (usage === undefined) {
        return undefined;
    }

    return {
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
        totalTokens: usage.totalTokens ?? 0,
    };
}

function toStopReason(finishReason: string | null | undefined): StopReason {
    if (finishReason === "tool_calls") {
        return "toolUse";
    }

    if (finishReason === "length") {
        return "length";
    }

    if (finishReason === "stop" || finishReason === null || finishReason === undefined) {
        return "stop";
    }

    return "error";
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readOptionalStringOrNull(value: unknown): string | null | undefined {
    if (value === undefined || value === null || typeof value === "string") {
        return value;
    }

    throw new Error("Expected optional string value in OpenAI-compatible response");
}

function readOptionalNumber(value: unknown): number | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (typeof value !== "number") {
        throw new Error("Expected optional number value in OpenAI-compatible response");
    }

    return value;
}

function toJsonObject(
    object: Record<string, unknown>,
    sourceName: string,
): JsonObject {
    const result: JsonObject = {};

    for (const [key, value] of Object.entries(object)) {
        result[key] = toJsonValue(value, sourceName);
    }

    return result;
}

function toJsonValue(value: unknown, sourceName: string): JsonValue {
    if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        value === null
    ) {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map((item) => toJsonValue(item, sourceName));
    }

    if (isRecord(value)) {
        return toJsonObject(value, sourceName);
    }

    throw new Error(`Expected JSON value in ${sourceName}`);
}
