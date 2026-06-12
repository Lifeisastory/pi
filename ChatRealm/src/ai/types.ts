export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
    | JsonPrimitive
    | JsonValue[]
    | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export interface TextContent {
    type: "text";
    text: string;
}

export interface ToolCallContent {
    type: "toolCall";
    id: string;
    name: string;
    arguments: JsonObject;
}

export type AssistantContent = TextContent | ToolCallContent;

export interface Usage {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    inputCacheHitTokens: number | undefined;
    inputCacheMissTokens: number | undefined;
}

export type StopReason = "stop" | "length" | "toolUse" | "error";

export interface UserMessage {
    role: "user";
    content: string;
}

export interface AssistantMessage {
    role: "assistant";
    content: AssistantContent[];
    model: string;
    usage: Usage | undefined;
    stopReason: StopReason;
    errorMessage: string | undefined;
}

export interface ToolResultMessage {
    role: "toolResult";
    toolCallId: string;
    toolName: string;
    content: string;
    isError: boolean;
}

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: JsonObject;
}

export interface ChatRequest {
    model: string;
    systemPrompt: string | undefined;
    messages: Message[];
    tools: ToolDefinition[];
}

export interface ChatResponse {
    message: AssistantMessage;
}

export interface ChatTransport {
    complete(request: ChatRequest): Promise<ChatResponse>;
    stream?(request: ChatRequest): AsyncIterable<ChatStreamEvent>;
}

export type ChatStreamEvent =
    | { type: "textDelta"; delta: string }
    | { type: "toolCall"; toolCall: ToolCallContent }
    | { type: "done"; response: ChatResponse }
    | { type: "error"; message: string };
