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

const DEFAULT_BASE_URL = "https://api.openai.com/v1";

export interface OpenAIResponsesOptions {
    apiKey: string;
    baseUrl?: string;
}

interface OpenAIResponsesResponse {
    output: OpenAIResponsesOutputItem[];
    status?: string;
    usage?: OpenAIResponsesUsage;
}

type OpenAIResponsesOutputItem =
    | OpenAIResponsesMessageItem
    | OpenAIResponsesFunctionCallItem;

interface OpenAIResponsesMessageItem {
    type: "message";
    content: OpenAIResponsesMessageContent[];
}

interface OpenAIResponsesMessageContent {
    type: "output_text" | "refusal";
    text?: string;
    refusal?: string;
}

interface OpenAIResponsesFunctionCallItem {
    type: "function_call";
    id?: string;
    callId: string;
    name: string;
    arguments: string;
}

interface OpenAIResponsesUsage {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    inputCacheHitTokens?: number;
}

interface OpenAIResponsesStreamEvent {
    type: string;
    item?: OpenAIResponsesStreamItem;
    delta?: string;
    arguments?: string;
    response?: OpenAIResponsesCompletedResponse;
    code?: string;
    message?: string;
}

type OpenAIResponsesStreamItem =
    | OpenAIResponsesStreamMessageItem
    | OpenAIResponsesStreamFunctionCallItem;

interface OpenAIResponsesStreamMessageItem {
    type: "message";
}

interface OpenAIResponsesStreamFunctionCallItem {
    type: "function_call";
    id?: string;
    callId: string;
    name: string;
    arguments?: string;
}

interface OpenAIResponsesCompletedResponse {
    status?: string;
    usage?: OpenAIResponsesUsage;
    error?: {
        code?: string;
        message?: string;
    };
}

interface ToolCallAccumulator {
    id: string | undefined;
    callId: string;
    name: string;
    arguments: string;
}

interface SseEventText {
    event: string;
    remainingBuffer: string;
}

class OpenAIResponsesTransport implements ChatTransport {
    private readonly apiKey: string;
    private readonly baseUrl: string;

    constructor(options: OpenAIResponsesOptions) {
        if (options.apiKey.trim() === "") {
            throw new Error("Missing OpenAI Responses API key");
        }

        const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;

        this.apiKey = options.apiKey;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    }

    async complete(request: ChatRequest): Promise<ChatResponse> {
        const response = await this.fetchResponses(createRequestBody(request, false));
        const responseText = await response.text();
        const json = parseJsonObject(responseText, "OpenAI Responses response");
        const data = parseResponsesResponse(json);

        return {
            message: toAssistantMessage(request.model, data),
        };
    }

    async *stream(request: ChatRequest): AsyncIterable<ChatStreamEvent> {
        const response = await this.fetchResponses(createRequestBody(request, true));

        if (response.body === null) {
            throw new Error("OpenAI Responses streaming response did not include a body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const textParts: string[] = [];
        const toolCalls = new Map<string, ToolCallAccumulator>();
        let status: string | undefined;
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

                for (const emittedEvent of processStreamEvent(
                    event,
                    request.model,
                    textParts,
                    toolCalls,
                )) {
                    yield emittedEvent;
                }

                if (event.type === "response.completed" && event.response !== undefined) {
                    status = event.response.status ?? status;
                    usage = toUsage(event.response.usage) ?? usage;
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

            for (const emittedEvent of processStreamEvent(
                event,
                request.model,
                textParts,
                toolCalls,
            )) {
                yield emittedEvent;
            }

            if (event.type === "response.completed" && event.response !== undefined) {
                status = event.response.status ?? status;
                usage = toUsage(event.response.usage) ?? usage;
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
                    stopReason: toStopReason(status, toolCalls.size > 0),
                    errorMessage: undefined,
                },
            },
        };
    }

    private async fetchResponses(body: JsonObject): Promise<Response> {
        const response = await fetch(`${this.baseUrl}/responses`, {
            method: "POST",
            headers: {
                authorization: `Bearer ${this.apiKey}`,
                "content-type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI Responses request failed with ${response.status}: ${errorText}`);
        }

        return response;
    }
}

export function createOpenAIResponsesTransport(
    options: OpenAIResponsesOptions,
): ChatTransport {
    return new OpenAIResponsesTransport(options);
}

function createRequestBody(request: ChatRequest, stream: boolean): JsonObject {
    const body: JsonObject = {
        model: request.model,
        input: toResponsesInput(request),
        store: false,
    };

    if (request.tools.length > 0) {
        body.tools = request.tools.map(toResponsesTool);
    }

    if (stream) {
        body.stream = true;
    }

    return body;
}

function toResponsesInput(request: ChatRequest): JsonValue[] {
    const input: JsonValue[] = [];

    if (request.systemPrompt !== undefined) {
        input.push({
            role: "system",
            content: request.systemPrompt,
        });
    }

    let assistantIndex = 0;

    for (const message of request.messages) {
        switch (message.role) {
            case "user":
                input.push({
                    role: "user",
                    content: [
                        {
                            type: "input_text",
                            text: message.content,
                        },
                    ],
                });
                break;

            case "assistant":
                input.push(...toResponsesAssistantItems(message, assistantIndex));
                assistantIndex += 1;
                break;

            case "toolResult":
                input.push(toResponsesToolResult(message));
                break;
        }
    }

    return input;
}

function toResponsesAssistantItems(
    message: AssistantMessage,
    assistantIndex: number,
): JsonValue[] {
    const items: JsonValue[] = [];
    const textParts: string[] = [];

    for (const content of message.content) {
        if (content.type === "text") {
            textParts.push(content.text);
            continue;
        }

        items.push(toResponsesFunctionCall(content));
    }

    if (textParts.length > 0) {
        items.unshift({
            type: "message",
            role: "assistant",
            status: "completed",
            id: `msg_${assistantIndex}`,
            content: [
                {
                    type: "output_text",
                    text: textParts.join("\n"),
                    annotations: [],
                },
            ],
        });
    }

    return items;
}

function toResponsesFunctionCall(content: ToolCallContent): JsonObject {
    const id = splitToolCallId(content.id);
    const item: JsonObject = {
        type: "function_call",
        call_id: id.callId,
        name: content.name,
        arguments: JSON.stringify(content.arguments),
    };

    if (id.itemId !== undefined) {
        item.id = id.itemId;
    }

    return item;
}

function toResponsesToolResult(message: Message): JsonObject {
    if (message.role !== "toolResult") {
        throw new Error("Expected tool result message");
    }

    return {
        type: "function_call_output",
        call_id: splitToolCallId(message.toolCallId).callId,
        output: message.content,
    };
}

function toResponsesTool(tool: ToolDefinition): JsonObject {
    return {
        type: "function",
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
        strict: false,
    };
}

function parseResponsesResponse(
    json: Record<string, unknown>,
): OpenAIResponsesResponse {
    const output = json.output;

    if (!Array.isArray(output)) {
        throw new Error("OpenAI Responses response is missing output");
    }

    return {
        output: output.map(parseOutputItem),
        status: readOptionalString(json.status),
        usage: parseUsage(json.usage),
    };
}

function parseOutputItem(value: unknown): OpenAIResponsesOutputItem {
    if (!isRecord(value)) {
        throw new Error("OpenAI Responses output item must be an object");
    }

    const type = value.type;

    if (type === "message") {
        const content = value.content;

        if (!Array.isArray(content)) {
            throw new Error("OpenAI Responses message output is missing content");
        }

        return {
            type,
            content: content.map(parseMessageContent),
        };
    }

    if (type === "function_call") {
        return {
            type,
            id: readOptionalString(value.id),
            callId: readRequiredString(value.call_id, "OpenAI Responses function call call_id"),
            name: readRequiredString(value.name, "OpenAI Responses function call name"),
            arguments: readRequiredString(value.arguments, "OpenAI Responses function call arguments"),
        };
    }

    throw new Error(`Unsupported OpenAI Responses output item type: ${String(type)}`);
}

function parseMessageContent(value: unknown): OpenAIResponsesMessageContent {
    if (!isRecord(value)) {
        throw new Error("OpenAI Responses message content must be an object");
    }

    if (value.type === "output_text") {
        return {
            type: "output_text",
            text: readOptionalString(value.text),
        };
    }

    if (value.type === "refusal") {
        return {
            type: "refusal",
            refusal: readOptionalString(value.refusal),
        };
    }

    throw new Error(`Unsupported OpenAI Responses message content type: ${String(value.type)}`);
}

function toAssistantMessage(
    model: string,
    response: OpenAIResponsesResponse,
): AssistantMessage {
    const textParts: string[] = [];
    const toolCalls: ToolCallContent[] = [];

    for (const outputItem of response.output) {
        if (outputItem.type === "message") {
            textParts.push(...toTextParts(outputItem));
            continue;
        }

        toolCalls.push(toToolCallContent(outputItem));
    }

    return {
        role: "assistant",
        content: createAssistantContentFromParts(textParts, toolCalls),
        model,
        usage: toUsage(response.usage),
        stopReason: toStopReason(response.status, toolCalls.length > 0),
        errorMessage: undefined,
    };
}

function toTextParts(item: OpenAIResponsesMessageItem): string[] {
    return item.content
        .map((content) => {
            if (content.type === "output_text") {
                return content.text ?? "";
            }

            return content.refusal ?? "";
        })
        .filter((text) => text !== "");
}

function toToolCallContent(item: OpenAIResponsesFunctionCallItem): ToolCallContent {
    const parsedArguments = parseJsonObject(
        item.arguments,
        `OpenAI Responses tool call ${item.name} arguments`,
    );

    return {
        type: "toolCall",
        id: joinToolCallId(item.callId, item.id),
        name: item.name,
        arguments: toJsonObject(parsedArguments, `OpenAI Responses tool call ${item.name} arguments`),
    };
}

function parseStreamEventText(eventText: string): OpenAIResponsesStreamEvent | undefined {
    const data = readSseData(eventText);

    if (data === undefined || data === "[DONE]") {
        return undefined;
    }

    return parseStreamEvent(parseJsonObject(data, "OpenAI Responses stream event"));
}

function parseStreamEvent(json: Record<string, unknown>): OpenAIResponsesStreamEvent {
    const type = readRequiredString(json.type, "OpenAI Responses stream event type");

    return {
        type,
        item: parseStreamItem(json.item),
        delta: readOptionalString(json.delta),
        arguments: readOptionalString(json.arguments),
        response: parseCompletedResponse(json.response),
        code: readOptionalString(json.code),
        message: readOptionalString(json.message),
    };
}

function parseStreamItem(value: unknown): OpenAIResponsesStreamItem | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }

    if (!isRecord(value)) {
        throw new Error("OpenAI Responses stream item must be an object");
    }

    if (value.type === "message") {
        return {
            type: "message",
        };
    }

    if (value.type === "function_call") {
        return {
            type: "function_call",
            id: readOptionalString(value.id),
            callId: readRequiredString(value.call_id, "OpenAI Responses stream function call call_id"),
            name: readRequiredString(value.name, "OpenAI Responses stream function call name"),
            arguments: readOptionalString(value.arguments),
        };
    }

    return undefined;
}

function parseCompletedResponse(value: unknown): OpenAIResponsesCompletedResponse | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }

    if (!isRecord(value)) {
        throw new Error("OpenAI Responses completed response must be an object");
    }

    return {
        status: readOptionalString(value.status),
        usage: parseUsage(value.usage),
        error: parseResponseError(value.error),
    };
}

function parseResponseError(value: unknown): OpenAIResponsesCompletedResponse["error"] {
    if (value === undefined || value === null) {
        return undefined;
    }

    if (!isRecord(value)) {
        throw new Error("OpenAI Responses error must be an object");
    }

    return {
        code: readOptionalString(value.code),
        message: readOptionalString(value.message),
    };
}

function processStreamEvent(
    event: OpenAIResponsesStreamEvent,
    model: string,
    textParts: string[],
    toolCalls: Map<string, ToolCallAccumulator>,
): ChatStreamEvent[] {
    switch (event.type) {
        case "response.output_item.added":
            if (event.item?.type === "function_call") {
                toolCalls.set(event.item.callId, {
                    id: event.item.id,
                    callId: event.item.callId,
                    name: event.item.name,
                    arguments: event.item.arguments ?? "",
                });
            }
            return [];

        case "response.output_text.delta":
            if (event.delta === undefined || event.delta === "") {
                return [];
            }
            textParts.push(event.delta);
            return [
                {
                    type: "textDelta",
                    delta: event.delta,
                },
            ];

        case "response.function_call_arguments.delta":
            appendFunctionArgumentsDelta(toolCalls, event.delta);
            return [];

        case "response.function_call_arguments.done":
            replaceFunctionArguments(toolCalls, event.arguments);
            return [];

        case "response.output_item.done":
            if (event.item?.type !== "function_call") {
                return [];
            }
            upsertFunctionCall(toolCalls, event.item);
            return [
                {
                    type: "toolCall",
                    toolCall: toToolCallContent({
                        type: "function_call",
                        id: event.item.id,
                        callId: event.item.callId,
                        name: event.item.name,
                        arguments: event.item.arguments ?? "{}",
                    }),
                },
            ];

        case "response.completed":
            if (event.response?.error !== undefined) {
                throw new Error(formatResponseError(event.response.error));
            }
            return [];

        case "response.failed":
            throw new Error(formatResponseError(event.response?.error));

        case "error":
            throw new Error(formatResponseError({
                code: event.code,
                message: event.message,
            }));

        default:
            return [];
    }
}

function appendFunctionArgumentsDelta(
    toolCalls: Map<string, ToolCallAccumulator>,
    delta: string | undefined,
): void {
    if (delta === undefined) {
        return;
    }

    const latest = getLatestToolCall(toolCalls);

    if (latest !== undefined) {
        latest.arguments += delta;
    }
}

function replaceFunctionArguments(
    toolCalls: Map<string, ToolCallAccumulator>,
    argumentsText: string | undefined,
): void {
    if (argumentsText === undefined) {
        return;
    }

    const latest = getLatestToolCall(toolCalls);

    if (latest !== undefined) {
        latest.arguments = argumentsText;
    }
}

function upsertFunctionCall(
    toolCalls: Map<string, ToolCallAccumulator>,
    item: OpenAIResponsesStreamFunctionCallItem,
): void {
    const existing = toolCalls.get(item.callId);

    toolCalls.set(item.callId, {
        id: item.id ?? existing?.id,
        callId: item.callId,
        name: item.name,
        arguments: item.arguments ?? existing?.arguments ?? "{}",
    });
}

function getLatestToolCall(
    toolCalls: Map<string, ToolCallAccumulator>,
): ToolCallAccumulator | undefined {
    let latest: ToolCallAccumulator | undefined;

    for (const [, toolCall] of toolCalls) {
        latest = toolCall;
    }

    return latest;
}

function createAssistantContent(
    textParts: string[],
    toolCalls: Map<string, ToolCallAccumulator>,
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
        content.push(toToolCallContent({
            type: "function_call",
            id: toolCall.id,
            callId: toolCall.callId,
            name: toolCall.name,
            arguments: toolCall.arguments || "{}",
        }));
    }

    return content;
}

function createAssistantContentFromParts(
    textParts: string[],
    toolCalls: ToolCallContent[],
): AssistantContent[] {
    const content: AssistantContent[] = [];
    const text = textParts.join("");

    if (text !== "") {
        content.push({
            type: "text",
            text,
        });
    }

    content.push(...toolCalls);
    return content;
}

function parseUsage(value: unknown): OpenAIResponsesUsage | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }

    if (!isRecord(value)) {
        throw new Error("OpenAI Responses usage must be an object");
    }

    return {
        inputTokens: readOptionalNumber(value.input_tokens),
        outputTokens: readOptionalNumber(value.output_tokens),
        totalTokens: readOptionalNumber(value.total_tokens),
        inputCacheHitTokens: readInputCacheHitTokens(value),
    };
}

function readInputCacheHitTokens(value: Record<string, unknown>): number | undefined {
    const details = value.input_tokens_details;

    if (details === undefined || details === null) {
        return undefined;
    }

    if (!isRecord(details)) {
        throw new Error("OpenAI Responses input_tokens_details must be an object");
    }

    return readOptionalNumber(details.cached_tokens);
}

function toUsage(usage: OpenAIResponsesUsage | undefined): Usage | undefined {
    if (usage === undefined) {
        return undefined;
    }

    const inputTokens = usage.inputTokens ?? 0;
    const inputCacheHitTokens = usage.inputCacheHitTokens;

    return {
        inputTokens,
        outputTokens: usage.outputTokens ?? 0,
        totalTokens: usage.totalTokens ?? 0,
        inputCacheHitTokens,
        inputCacheMissTokens: inputCacheHitTokens === undefined
            ? undefined
            : Math.max(0, inputTokens - inputCacheHitTokens),
    };
}

function toStopReason(status: string | undefined, hasToolCalls: boolean): StopReason {
    if (hasToolCalls) {
        return "toolUse";
    }

    if (status === "incomplete") {
        return "length";
    }

    if (status === "failed" || status === "cancelled") {
        return "error";
    }

    return "stop";
}

function splitToolCallId(id: string): { callId: string; itemId: string | undefined } {
    const separatorIndex = id.indexOf("|");

    if (separatorIndex === -1) {
        return {
            callId: id,
            itemId: undefined,
        };
    }

    return {
        callId: id.slice(0, separatorIndex),
        itemId: id.slice(separatorIndex + 1),
    };
}

function joinToolCallId(callId: string, itemId: string | undefined): string {
    return itemId === undefined || itemId === "" ? callId : `${callId}|${itemId}`;
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

function formatResponseError(
    error: OpenAIResponsesCompletedResponse["error"],
): string {
    if (error === undefined) {
        return "OpenAI Responses request failed";
    }

    if (error.code !== undefined && error.message !== undefined) {
        return `${error.code}: ${error.message}`;
    }

    return error.message ?? error.code ?? "OpenAI Responses request failed";
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

    throw new Error("Expected optional string value in OpenAI Responses response");
}

function readOptionalNumber(value: unknown): number | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (typeof value !== "number") {
        throw new Error("Expected optional number value in OpenAI Responses response");
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
