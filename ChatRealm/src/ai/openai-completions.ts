import { parseJsonObject } from "../utils/json";
import type {
    AssistantContent,
    AssistantMessage,
    ChatRequest,
    ChatResponse,
    ChatStreamEvent,
    ChatTransport,
    JsonObject,
    JsonValue,
    Message,
    StopReason,
    ToolDefinition,
    Usage,
} from "./types";

const DEFAULT_BASE_URL = "https://api.openai.com/v1";

export interface OpenAICompletionsOptions {
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
    inputCacheHitTokens?: number;
    inputCacheMissTokens?: number;
}

interface OpenAIChatCompletionStreamChunk {
    choices: OpenAIStreamChoice[];
    usage?: OpenAIUsage;
}

interface OpenAIStreamChoice {
    finishReason?: string | null;
    delta: OpenAIStreamDelta;
}

interface OpenAIStreamDelta {
    content?: string | null;
    toolCalls?: OpenAIToolCallDelta[];
}

interface OpenAIToolCallDelta {
    index: number;
    id?: string;
    type?: string;
    functionName?: string;
    functionArguments?: string;
}

interface ToolCallAccumulator {
    id: string | undefined;
    type: string | undefined;
    functionName: string;
    functionArguments: string;
}

interface SseEventText {
    event: string;
    remainingBuffer: string;
}

class OpenAICompletionsTransport implements ChatTransport {
    private readonly apiKey: string;
    private readonly baseUrl: string;

    constructor(options: OpenAICompletionsOptions) {
        if (options.apiKey.trim() === "") {
            throw new Error("Missing OpenAI Completions API key");
        }

        const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;

        this.apiKey = options.apiKey;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    }

    async complete(request: ChatRequest): Promise<ChatResponse> {
        const response = await this.fetchChatCompletions(createRequestBody(request, false));

        const responseText = await response.text();
        const json = parseJsonObject(responseText, "OpenAI Completions response");
        const data = parseChatCompletionResponse(json);
        const choice = data.choices[0];

        if (choice === undefined) {
            throw new Error("OpenAI Completions response did not include a choice");
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

    async *stream(request: ChatRequest): AsyncIterable<ChatStreamEvent> {
        const response = await this.fetchChatCompletions(createRequestBody(request, true));

        if (response.body === null) {
            throw new Error("OpenAI Completions streaming response did not include a body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const textParts: string[] = [];
        const toolCalls = new Map<number, ToolCallAccumulator>();
        let finishReason: string | null | undefined;
        let usage: Usage | undefined;

        while (true) {
            const result = await reader.read();

            if (result.done) {
                break;
            }

            buffer += decoder.decode(result.value, { stream: true });

            for (const eventText of takeSseEvents(buffer)) {
                buffer = eventText.remainingBuffer;

                const data = readSseData(eventText.event);

                if (data === undefined || data === "[DONE]") {
                    continue;
                }

                const chunk = parseStreamChunk(
                    parseJsonObject(data, "OpenAI Completions stream chunk"),
                );

                usage = toUsage(chunk.usage) ?? usage;

                for (const choice of chunk.choices) {
                    finishReason = choice.finishReason ?? finishReason;

                    if (choice.delta.content !== undefined && choice.delta.content !== null) {
                        textParts.push(choice.delta.content);
                        yield {
                            type: "textDelta",
                            delta: choice.delta.content,
                        };
                    }

                    for (const toolCall of choice.delta.toolCalls ?? []) {
                        accumulateToolCallDelta(toolCalls, toolCall);
                    }
                }
            }
        }

        buffer += decoder.decode();

        for (const eventText of takeSseEvents(buffer)) {
            buffer = eventText.remainingBuffer;

            const data = readSseData(eventText.event);

            if (data === undefined || data === "[DONE]") {
                continue;
            }

            const chunk = parseStreamChunk(
                parseJsonObject(data, "OpenAI Completions stream chunk"),
            );

            usage = toUsage(chunk.usage) ?? usage;

            for (const choice of chunk.choices) {
                finishReason = choice.finishReason ?? finishReason;

                if (choice.delta.content !== undefined && choice.delta.content !== null) {
                    textParts.push(choice.delta.content);
                    yield {
                        type: "textDelta",
                        delta: choice.delta.content,
                    };
                }

                for (const toolCall of choice.delta.toolCalls ?? []) {
                    accumulateToolCallDelta(toolCalls, toolCall);
                }
            }
        }

        const content: AssistantContent[] = [];
        const text = textParts.join("");

        if (text !== "") {
            content.push({
                type: "text",
                text,
            });
        }

        for (const [, toolCall] of [...toolCalls.entries()].sort(
            ([left], [right]) => left - right,
        )) {
            content.push(toToolCallContent({
                id: toolCall.id,
                type: toolCall.type,
                functionName: toolCall.functionName,
                functionArguments: toolCall.functionArguments,
            }));
        }

        yield {
            type: "done",
            response: {
                message: {
                    role: "assistant",
                    content,
                    model: request.model,
                    usage,
                    stopReason: toStopReason(finishReason),
                    errorMessage: undefined,
                },
            },
        };
    }

    private async fetchChatCompletions(body: JsonObject): Promise<Response> {
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
                `OpenAI Completions request failed with ${response.status}: ${errorText}`,
            );
        }

        return response;
    }
}

export function createOpenAICompletionsTransport(
    options: OpenAICompletionsOptions,
): ChatTransport {
    return new OpenAICompletionsTransport(options);
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

function createRequestBody(request: ChatRequest, stream: boolean): JsonObject {
    const body: JsonObject = {
        model: request.model,
        messages: toOpenAIMessages(request),
    };

    if (request.tools.length > 0) {
        body.tools = request.tools.map(toOpenAITool);
    }

    if (stream) {
        body.stream = true;
        body.stream_options = {
            include_usage: true,
        };
    }

    return body;
}

function takeSseEvents(buffer: string): SseEventText[] {
    const events: SseEventText[] = [];
    let remainingBuffer = buffer;

    while (true) {
        const boundary = findSseBoundary(remainingBuffer);

        if (boundary === undefined) {
            return events;
        }

        const event = remainingBuffer.slice(0, boundary.index);
        remainingBuffer = remainingBuffer.slice(boundary.index + boundary.length);
        events.push({
            event,
            remainingBuffer,
        });
    }
}

function findSseBoundary(
    buffer: string,
): { index: number; length: number } | undefined {
    const windowsBoundary = buffer.indexOf("\r\n\r\n");
    const unixBoundary = buffer.indexOf("\n\n");

    if (windowsBoundary === -1 && unixBoundary === -1) {
        return undefined;
    }

    if (windowsBoundary !== -1 && (unixBoundary === -1 || windowsBoundary < unixBoundary)) {
        return {
            index: windowsBoundary,
            length: 4,
        };
    }

    return {
        index: unixBoundary,
        length: 2,
    };
}

function readSseData(event: string): string | undefined {
    const dataLines = event
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice("data:".length).trimStart());

    if (dataLines.length === 0) {
        return undefined;
    }

    return dataLines.join("\n");
}

function parseStreamChunk(
    json: Record<string, unknown>,
): OpenAIChatCompletionStreamChunk {
    const choices = json.choices;

    if (!Array.isArray(choices)) {
        throw new Error("OpenAI Completions stream chunk is missing choices");
    }

    return {
        choices: choices.map(parseStreamChoice),
        usage: parseUsage(json.usage),
    };
}

function parseStreamChoice(value: unknown): OpenAIStreamChoice {
    if (!isRecord(value)) {
        throw new Error("OpenAI Completions stream choice must be an object");
    }

    const delta = value.delta;

    if (!isRecord(delta)) {
        throw new Error("OpenAI Completions stream choice is missing delta");
    }

    const toolCalls = delta.tool_calls;

    if (toolCalls !== undefined && !Array.isArray(toolCalls)) {
        throw new Error("OpenAI Completions stream tool_calls must be an array");
    }

    return {
        finishReason: readOptionalStringOrNull(value.finish_reason),
        delta: {
            content: readOptionalStringOrNull(delta.content),
            toolCalls: toolCalls?.map(parseToolCallDelta),
        },
    };
}

function parseToolCallDelta(value: unknown): OpenAIToolCallDelta {
    if (!isRecord(value)) {
        throw new Error("OpenAI Completions stream tool call must be an object");
    }

    if (typeof value.index !== "number") {
        throw new Error("OpenAI Completions stream tool call is missing index");
    }

    const fn = value.function;

    if (fn !== undefined && !isRecord(fn)) {
        throw new Error("OpenAI Completions stream tool call function must be an object");
    }

    return {
        index: value.index,
        id: readOptionalStringOrNull(value.id) ?? undefined,
        type: readOptionalStringOrNull(value.type) ?? undefined,
        functionName: fn === undefined
            ? undefined
            : readOptionalStringOrNull(fn.name) ?? undefined,
        functionArguments: fn === undefined
            ? undefined
            : readOptionalStringOrNull(fn.arguments) ?? undefined,
    };
}

function accumulateToolCallDelta(
    toolCalls: Map<number, ToolCallAccumulator>,
    delta: OpenAIToolCallDelta,
): void {
    const existing = toolCalls.get(delta.index) ?? {
        id: undefined,
        type: undefined,
        functionName: "",
        functionArguments: "",
    };

    existing.id = delta.id ?? existing.id;
    existing.type = delta.type ?? existing.type;
    existing.functionName += delta.functionName ?? "";
    existing.functionArguments += delta.functionArguments ?? "";
    toolCalls.set(delta.index, existing);
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
        throw new Error("OpenAI Completions response is missing choices");
    }

    return {
        choices: choices.map(parseChoice),
        usage: parseUsage(json.usage),
    };
}

function parseChoice(value: unknown): OpenAIChoice {
    if (!isRecord(value)) {
        throw new Error("OpenAI Completions choice must be an object");
    }

    const message = value.message;

    if (!isRecord(message)) {
        throw new Error("OpenAI Completions choice is missing message");
    }

    const toolCalls = message.tool_calls;

    if (toolCalls !== undefined && !Array.isArray(toolCalls)) {
        throw new Error("OpenAI Completions tool_calls must be an array");
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
        throw new Error("OpenAI Completions tool call must be an object");
    }

    const fn = value.function;

    if (!isRecord(fn)) {
        throw new Error("OpenAI Completions tool call is missing function");
    }

    return {
        id: readOptionalStringOrNull(value.id) ?? undefined,
        type: readOptionalStringOrNull(value.type) ?? undefined,
        functionName: readOptionalStringOrNull(fn.name) ?? undefined,
        functionArguments: readOptionalStringOrNull(fn.arguments) ?? undefined,
    };
}

function parseUsage(value: unknown): OpenAIUsage | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }

    if (!isRecord(value)) {
        throw new Error("OpenAI Completions usage must be an object");
    }

    return {
        inputTokens: readOptionalNumber(value.prompt_tokens),
        outputTokens: readOptionalNumber(value.completion_tokens),
        totalTokens: readOptionalNumber(value.total_tokens),
        inputCacheHitTokens: readInputCacheHitTokens(value),
        inputCacheMissTokens: readInputCacheMissTokens(value),
    };
}

function readInputCacheHitTokens(value: Record<string, unknown>): number | undefined {
    return (
        readOptionalNumber(value.prompt_cache_hit_tokens) ??
        readPromptTokensDetailsCachedTokens(value.prompt_tokens_details)
    );
}

function readInputCacheMissTokens(value: Record<string, unknown>): number | undefined {
    const directMiss = readOptionalNumber(value.prompt_cache_miss_tokens);

    if (directMiss !== undefined) {
        return directMiss;
    }

    const inputTokens = readOptionalNumber(value.prompt_tokens);
    const inputCacheHitTokens = readInputCacheHitTokens(value);

    if (inputTokens === undefined || inputCacheHitTokens === undefined) {
        return undefined;
    }

    return Math.max(0, inputTokens - inputCacheHitTokens);
}

function readPromptTokensDetailsCachedTokens(value: unknown): number | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }

    if (!isRecord(value)) {
        throw new Error("OpenAI Completions prompt_tokens_details must be an object");
    }

    return readOptionalNumber(value.cached_tokens);
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
        throw new Error(`Unsupported OpenAI Completions tool call type: ${toolCall.type}`);
    }

    if (toolCall.id === undefined || toolCall.id === "") {
        throw new Error("OpenAI Completions tool call is missing id");
    }

    if (toolCall.functionName === undefined || toolCall.functionName === "") {
        throw new Error("OpenAI Completions tool call is missing function name");
    }

    if (toolCall.functionArguments === undefined) {
        throw new Error("OpenAI Completions tool call is missing function arguments");
    }

    const parsedArguments = parseJsonObject(
        toolCall.functionArguments,
        `OpenAI Completions tool call ${toolCall.functionName} arguments`,
    );

    return {
        type: "toolCall",
        id: toolCall.id,
        name: toolCall.functionName,
        arguments: toJsonObject(
            parsedArguments,
            `OpenAI Completions tool call ${toolCall.functionName} arguments`,
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
        inputCacheHitTokens: usage.inputCacheHitTokens,
        inputCacheMissTokens: usage.inputCacheMissTokens,
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

    throw new Error("Expected optional string value in OpenAI Completions response");
}

function readOptionalNumber(value: unknown): number | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (typeof value !== "number") {
        throw new Error("Expected optional number value in OpenAI Completions response");
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
