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
    ToolCallContent,
    ToolDefinition,
    Usage,
} from "./types";

const DEFAULT_BASE_URL = "https://api.anthropic.com/v1";
const ANTHROPIC_VERSION = "2023-06-01";

export interface AnthropicMessagesOptions {
    apiKey: string;
    baseUrl?: string;
}

interface AnthropicMessageResponse {
    content: AnthropicContentBlock[];
    stopReason?: string | null;
    usage?: AnthropicUsage;
}

type AnthropicContentBlock = AnthropicTextBlock | AnthropicToolUseBlock;

interface AnthropicTextBlock {
    type: "text";
    text: string;
}

interface AnthropicToolUseBlock {
    type: "tool_use";
    id: string;
    name: string;
    input: JsonObject;
}

interface AnthropicUsage {
    inputTokens?: number;
    outputTokens?: number;
    cacheReadInputTokens?: number;
    cacheCreationInputTokens?: number;
}

interface AnthropicStreamEvent {
    type: string;
    index?: number;
    contentBlock?: AnthropicStreamContentBlock;
    delta?: AnthropicStreamDelta;
    message?: {
        usage?: AnthropicUsage;
    };
    usage?: AnthropicUsage;
    stopReason?: string | null;
}

type AnthropicStreamContentBlock =
    | {
        type: "text";
        text?: string;
    }
    | {
        type: "tool_use";
        id: string;
        name: string;
        input?: JsonObject;
    };

type AnthropicStreamDelta =
    | {
        type: "text_delta";
        text: string;
    }
    | {
        type: "input_json_delta";
        partialJson: string;
    };

interface ToolCallAccumulator {
    id: string;
    name: string;
    arguments: string;
}

interface SseEventText {
    event: string;
    remainingBuffer: string;
}

class AnthropicMessagesTransport implements ChatTransport {
    private readonly apiKey: string;
    private readonly baseUrl: string;

    constructor(options: AnthropicMessagesOptions) {
        if (options.apiKey.trim() === "") {
            throw new Error("Missing Anthropic Messages API key");
        }

        const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;

        this.apiKey = options.apiKey;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    }

    async complete(request: ChatRequest): Promise<ChatResponse> {
        const response = await this.fetchMessages(createRequestBody(request, false));
        const responseText = await response.text();
        const json = parseJsonObject(responseText, "Anthropic Messages response");
        const data = parseMessageResponse(json);

        return {
            message: toAssistantMessage(request.model, data),
        };
    }

    async *stream(request: ChatRequest): AsyncIterable<ChatStreamEvent> {
        const response = await this.fetchMessages(createRequestBody(request, true));

        if (response.body === null) {
            throw new Error("Anthropic Messages streaming response did not include a body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const textParts: string[] = [];
        const toolCalls = new Map<number, ToolCallAccumulator>();
        let stopReason: string | null | undefined;
        let usage: Usage | undefined;

        while (true) {
            const result = await reader.read();

            if (result.done) {
                break;
            }

            buffer += decoder.decode(result.value, { stream: true });

            for (const eventText of takeSseEvents(buffer)) {
                buffer = eventText.remainingBuffer;

                const event = parseStreamEventText(eventText.event);

                if (event === undefined) {
                    continue;
                }

                for (const emittedEvent of processStreamEvent(event, textParts, toolCalls)) {
                    yield emittedEvent;
                }

                if (event.type === "message_start") {
                    usage = toUsage(event.message?.usage) ?? usage;
                }

                if (event.type === "message_delta") {
                    stopReason = event.stopReason ?? stopReason;
                    usage = mergeUsage(usage, event.usage);
                }
            }
        }

        buffer += decoder.decode();

        for (const eventText of takeSseEvents(buffer)) {
            buffer = eventText.remainingBuffer;

            const event = parseStreamEventText(eventText.event);

            if (event === undefined) {
                continue;
            }

            for (const emittedEvent of processStreamEvent(event, textParts, toolCalls)) {
                yield emittedEvent;
            }

            if (event.type === "message_start") {
                usage = toUsage(event.message?.usage) ?? usage;
            }

            if (event.type === "message_delta") {
                stopReason = event.stopReason ?? stopReason;
                usage = mergeUsage(usage, event.usage);
            }
        }

        yield {
            type: "done",
            response: {
                message: {
                    role: "assistant",
                    content: createAssistantContent(textParts, toolCalls),
                    model: request.model,
                    usage,
                    stopReason: toStopReason(stopReason, toolCalls.size > 0),
                    errorMessage: undefined,
                },
            },
        };
    }

    private async fetchMessages(body: JsonObject): Promise<Response> {
        const response = await fetch(`${this.baseUrl}/messages`, {
            method: "POST",
            headers: {
                "anthropic-version": ANTHROPIC_VERSION,
                "content-type": "application/json",
                "x-api-key": this.apiKey,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Anthropic Messages request failed with ${response.status}: ${errorText}`);
        }

        return response;
    }
}

export function createAnthropicMessagesTransport(
    options: AnthropicMessagesOptions,
): ChatTransport {
    return new AnthropicMessagesTransport(options);
}

function createRequestBody(request: ChatRequest, stream: boolean): JsonObject {
    const body: JsonObject = {
        model: request.model,
        max_tokens: 4096,
        messages: toAnthropicMessages(request.messages),
    };

    if (request.systemPrompt !== undefined) {
        body.system = request.systemPrompt;
    }

    if (request.tools.length > 0) {
        body.tools = request.tools.map(toAnthropicTool);
    }

    if (stream) {
        body.stream = true;
    }

    return body;
}

function toAnthropicMessages(messages: Message[]): JsonValue[] {
    const result: JsonValue[] = [];

    for (let index = 0; index < messages.length; index += 1) {
        const message = messages[index];

        switch (message.role) {
            case "user":
                result.push({
                    role: "user",
                    content: message.content,
                });
                break;

            case "assistant":
                result.push({
                    role: "assistant",
                    content: toAnthropicAssistantContent(message),
                });
                break;

            case "toolResult": {
                const toolResults: JsonValue[] = [];
                let currentIndex = index;

                while (currentIndex < messages.length && messages[currentIndex]?.role === "toolResult") {
                    const toolResult = messages[currentIndex];

                    if (toolResult?.role !== "toolResult") {
                        break;
                    }

                    toolResults.push({
                        type: "tool_result",
                        tool_use_id: toolResult.toolCallId,
                        content: toolResult.content,
                        is_error: toolResult.isError,
                    });
                    currentIndex += 1;
                }

                result.push({
                    role: "user",
                    content: toolResults,
                });
                index = currentIndex - 1;
                break;
            }
        }
    }

    return result;
}

function toAnthropicAssistantContent(message: AssistantMessage): JsonValue[] {
    const blocks: JsonValue[] = [];

    for (const content of message.content) {
        if (content.type === "text") {
            blocks.push({
                type: "text",
                text: content.text,
            });
            continue;
        }

        blocks.push({
            type: "tool_use",
            id: content.id,
            name: content.name,
            input: content.arguments,
        });
    }

    return blocks;
}

function toAnthropicTool(tool: ToolDefinition): JsonObject {
    return {
        name: tool.name,
        description: tool.description,
        input_schema: tool.parameters,
    };
}

function parseMessageResponse(json: Record<string, unknown>): AnthropicMessageResponse {
    const content = json.content;

    if (!Array.isArray(content)) {
        throw new Error("Anthropic Messages response is missing content");
    }

    return {
        content: content.map(parseContentBlock),
        stopReason: readOptionalStringOrNull(json.stop_reason),
        usage: parseUsage(json.usage),
    };
}

function parseContentBlock(value: unknown): AnthropicContentBlock {
    if (!isRecord(value)) {
        throw new Error("Anthropic Messages content block must be an object");
    }

    if (value.type === "text") {
        return {
            type: "text",
            text: readRequiredString(value.text, "Anthropic Messages text block text"),
        };
    }

    if (value.type === "tool_use") {
        return {
            type: "tool_use",
            id: readRequiredString(value.id, "Anthropic Messages tool_use id"),
            name: readRequiredString(value.name, "Anthropic Messages tool_use name"),
            input: readJsonObject(value.input, "Anthropic Messages tool_use input"),
        };
    }

    throw new Error(`Unsupported Anthropic Messages content block type: ${String(value.type)}`);
}

function toAssistantMessage(
    model: string,
    response: AnthropicMessageResponse,
): AssistantMessage {
    const content: AssistantContent[] = response.content.map((block) => {
        if (block.type === "text") {
            return {
                type: "text",
                text: block.text,
            };
        }

        return {
            type: "toolCall",
            id: block.id,
            name: block.name,
            arguments: block.input,
        };
    });

    const hasToolCalls = content.some((block) => block.type === "toolCall");

    return {
        role: "assistant",
        content,
        model,
        usage: toUsage(response.usage),
        stopReason: toStopReason(response.stopReason, hasToolCalls),
        errorMessage: undefined,
    };
}

function parseStreamEventText(eventText: string): AnthropicStreamEvent | undefined {
    const data = readSseData(eventText);

    if (data === undefined || data === "[DONE]") {
        return undefined;
    }

    return parseStreamEvent(parseJsonObject(data, "Anthropic Messages stream event"));
}

function parseStreamEvent(json: Record<string, unknown>): AnthropicStreamEvent {
    const type = readRequiredString(json.type, "Anthropic Messages stream event type");

    return {
        type,
        index: readOptionalNumber(json.index),
        contentBlock: parseStreamContentBlock(json.content_block),
        delta: parseStreamDelta(json.delta),
        message: parseStreamMessage(json.message),
        usage: parseUsage(json.usage),
        stopReason: parseStreamStopReason(json.delta),
    };
}

function parseStreamContentBlock(value: unknown): AnthropicStreamContentBlock | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }

    if (!isRecord(value)) {
        throw new Error("Anthropic Messages stream content block must be an object");
    }

    if (value.type === "text") {
        return {
            type: "text",
            text: readOptionalString(value.text),
        };
    }

    if (value.type === "tool_use") {
        return {
            type: "tool_use",
            id: readRequiredString(value.id, "Anthropic Messages stream tool_use id"),
            name: readRequiredString(value.name, "Anthropic Messages stream tool_use name"),
            input: value.input === undefined
                ? undefined
                : readJsonObject(value.input, "Anthropic Messages stream tool_use input"),
        };
    }

    return undefined;
}

function parseStreamDelta(value: unknown): AnthropicStreamDelta | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }

    if (!isRecord(value)) {
        throw new Error("Anthropic Messages stream delta must be an object");
    }

    if (value.type === "text_delta") {
        return {
            type: "text_delta",
            text: readRequiredString(value.text, "Anthropic Messages text delta text"),
        };
    }

    if (value.type === "input_json_delta") {
        return {
            type: "input_json_delta",
            partialJson: readRequiredString(
                value.partial_json,
                "Anthropic Messages input_json_delta partial_json",
            ),
        };
    }

    return undefined;
}

function parseStreamMessage(value: unknown): AnthropicStreamEvent["message"] {
    if (value === undefined || value === null) {
        return undefined;
    }

    if (!isRecord(value)) {
        throw new Error("Anthropic Messages stream message must be an object");
    }

    return {
        usage: parseUsage(value.usage),
    };
}

function parseStreamStopReason(delta: unknown): string | null | undefined {
    if (delta === undefined || delta === null) {
        return undefined;
    }

    if (!isRecord(delta)) {
        throw new Error("Anthropic Messages stream message delta must be an object");
    }

    return readOptionalStringOrNull(delta.stop_reason);
}

function processStreamEvent(
    event: AnthropicStreamEvent,
    textParts: string[],
    toolCalls: Map<number, ToolCallAccumulator>,
): ChatStreamEvent[] {
    switch (event.type) {
        case "content_block_start":
            if (event.index === undefined || event.contentBlock?.type !== "tool_use") {
                return [];
            }
            toolCalls.set(event.index, {
                id: event.contentBlock.id,
                name: event.contentBlock.name,
                arguments: formatInitialToolInput(event.contentBlock.input),
            });
            return [];

        case "content_block_delta":
            if (event.delta?.type === "text_delta") {
                textParts.push(event.delta.text);
                return [
                    {
                        type: "textDelta",
                        delta: event.delta.text,
                    },
                ];
            }

            if (event.delta?.type === "input_json_delta" && event.index !== undefined) {
                const toolCall = toolCalls.get(event.index);

                if (toolCall !== undefined) {
                    toolCall.arguments += event.delta.partialJson;
                }
            }
            return [];

        case "content_block_stop":
            if (event.index === undefined) {
                return [];
            }
            return createToolCallEvent(toolCalls.get(event.index));

        default:
            return [];
    }
}

function createToolCallEvent(toolCall: ToolCallAccumulator | undefined): ChatStreamEvent[] {
    if (toolCall === undefined) {
        return [];
    }

    return [
        {
            type: "toolCall",
            toolCall: toToolCallContent(toolCall),
        },
    ];
}

function formatInitialToolInput(input: JsonObject | undefined): string {
    if (input === undefined || Object.keys(input).length === 0) {
        return "";
    }

    return JSON.stringify(input);
}

function createAssistantContent(
    textParts: string[],
    toolCalls: Map<number, ToolCallAccumulator>,
): AssistantContent[] {
    const content: AssistantContent[] = [];
    const text = textParts.join("");

    if (text !== "") {
        content.push({
            type: "text",
            text,
        });
    }

    for (const [, toolCall] of toolCalls) {
        content.push(toToolCallContent(toolCall));
    }

    return content;
}

function toToolCallContent(toolCall: ToolCallAccumulator): ToolCallContent {
    const parsedArguments = parseJsonObject(
        toolCall.arguments || "{}",
        `Anthropic Messages tool call ${toolCall.name} arguments`,
    );

    return {
        type: "toolCall",
        id: toolCall.id,
        name: toolCall.name,
        arguments: toJsonObject(parsedArguments, `Anthropic Messages tool call ${toolCall.name} arguments`),
    };
}

function parseUsage(value: unknown): AnthropicUsage | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }

    if (!isRecord(value)) {
        throw new Error("Anthropic Messages usage must be an object");
    }

    return {
        inputTokens: readOptionalNumber(value.input_tokens),
        outputTokens: readOptionalNumber(value.output_tokens),
        cacheReadInputTokens: readOptionalNumber(value.cache_read_input_tokens),
        cacheCreationInputTokens: readOptionalNumber(value.cache_creation_input_tokens),
    };
}

function toUsage(usage: AnthropicUsage | undefined): Usage | undefined {
    if (usage === undefined) {
        return undefined;
    }

    const inputTokens = usage.inputTokens ?? 0;
    const cacheReadInputTokens = usage.cacheReadInputTokens ?? 0;
    const cacheCreationInputTokens = usage.cacheCreationInputTokens ?? 0;
    const outputTokens = usage.outputTokens ?? 0;
    const totalInputTokens = inputTokens + cacheReadInputTokens + cacheCreationInputTokens;

    return {
        inputTokens: totalInputTokens,
        outputTokens,
        totalTokens: totalInputTokens + outputTokens,
        inputCacheHitTokens: usage.cacheReadInputTokens,
        inputCacheMissTokens: inputTokens + cacheCreationInputTokens,
    };
}

function mergeUsage(existing: Usage | undefined, next: AnthropicUsage | undefined): Usage | undefined {
    if (next === undefined) {
        return existing;
    }

    const nextUsage = toUsage(next);

    if (nextUsage === undefined) {
        return existing;
    }

    if (existing === undefined) {
        return nextUsage;
    }

    const inputTokens = nextUsage.inputTokens === 0 ? existing.inputTokens : nextUsage.inputTokens;
    const outputTokens = nextUsage.outputTokens === 0 ? existing.outputTokens : nextUsage.outputTokens;
    const inputCacheHitTokens = nextUsage.inputTokens === 0
        ? existing.inputCacheHitTokens
        : nextUsage.inputCacheHitTokens ?? existing.inputCacheHitTokens;
    const inputCacheMissTokens = nextUsage.inputTokens === 0
        ? existing.inputCacheMissTokens
        : nextUsage.inputCacheMissTokens ?? existing.inputCacheMissTokens;

    return {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        inputCacheHitTokens,
        inputCacheMissTokens,
    };
}

function toStopReason(reason: string | null | undefined, hasToolCalls: boolean): StopReason {
    if (hasToolCalls || reason === "tool_use") {
        return "toolUse";
    }

    if (reason === "max_tokens") {
        return "length";
    }

    if (reason === "refusal" || reason === "sensitive") {
        return "error";
    }

    return "stop";
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

function readJsonObject(value: unknown, sourceName: string): JsonObject {
    if (!isRecord(value)) {
        throw new Error(`Expected object for ${sourceName}`);
    }

    return toJsonObject(value, sourceName);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRequiredString(value: unknown, sourceName: string): string {
    if (typeof value !== "string") {
        throw new Error(`Expected string for ${sourceName}`);
    }

    return value;
}

function readOptionalString(value: unknown): string | undefined {
    if (value === undefined || typeof value === "string") {
        return value;
    }

    throw new Error("Expected optional string value in Anthropic Messages response");
}

function readOptionalStringOrNull(value: unknown): string | null | undefined {
    if (value === undefined || value === null || typeof value === "string") {
        return value;
    }

    throw new Error("Expected optional string value in Anthropic Messages response");
}

function readOptionalNumber(value: unknown): number | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (typeof value !== "number") {
        throw new Error("Expected optional number value in Anthropic Messages response");
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
