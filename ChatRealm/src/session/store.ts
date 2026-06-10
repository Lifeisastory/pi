import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import type {
    AssistantContent,
    AssistantMessage,
    JsonObject,
    JsonValue,
    Message,
    StopReason,
    TextContent,
    ToolCallContent,
    ToolResultMessage,
    Usage,
    UserMessage,
} from "../ai/types";

import { parseJsonObject } from "../utils/json";

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export interface SavedSession {
    version: 1;
    savedAt: string;
    messages: Message[];
}

export interface SessionStoreOptions {
    cwd: string;
    sessionName?: string;
}

const DEFAULT_SESSION_NAME = "default";

export function getSessionPath(options: SessionStoreOptions): string {
    const sessionName = options.sessionName ?? DEFAULT_SESSION_NAME;
    return resolve(options.cwd, ".chatrealm", "sessions", `${sessionName}.json`).replaceAll("\\", "/");
}

export async function loadSessionMessages(
    options: SessionStoreOptions,
): Promise<Message[]> {
    const sessionPath = getSessionPath(options);

    let text: string;

    try {
        text = await readFile(sessionPath, "utf8");
    } catch (error) {
        if (isNodeErrorWithCode(error, "ENOENT")) {
            return [];
        }

        throw error;
    }

    const json = parseJsonObject(text, sessionPath);
    const session = parseSavedSession(json, sessionPath);

    return session.messages;
}

export async function saveSessionMessages(
    options: SessionStoreOptions,
    messages: Message[],
): Promise<void> {
    const sessionPath = getSessionPath(options);
    const session: SavedSession = {
        version: 1,
        savedAt: new Date().toISOString(),
        messages,
    };

    await mkdir(dirname(sessionPath), { recursive: true });
    await writeFile(sessionPath, `${JSON.stringify(session, null, 2)}\n`, "utf8");
}

function isNodeErrorWithCode(error: unknown, code: string): boolean {
    return (
        error instanceof Error &&
        "code" in error &&
        (error as { code?: unknown }).code === code
    );
}

function parseSavedSession(
    value: Record<string, unknown>,
    sourceName: string,
): SavedSession {
    if (value.version !== 1) {
        throw new Error(`Unsupported session version in ${sourceName}`);
    }

    if (typeof value.savedAt !== "string") {
        throw new Error(`Expected savedAt string in ${sourceName}`);
    }

    if (!Array.isArray(value.messages)) {
        throw new Error(`Expected messages array in ${sourceName}`);
    }

    return {
        version: 1,
        savedAt: value.savedAt,
        messages: value.messages.map((message, index) =>
            parseMessage(message, `${sourceName} messages[${index}]`),
        ),
    };
}

function parseMessage(value: unknown, sourceName: string): Message {
    if (!isRecord(value)) {
        throw new Error(`Expected message object in ${sourceName}`);
    }

    switch (value.role) {
        case "user":
            return parseUserMessage(value, sourceName);
        case "assistant":
            return parseAssistantMessage(value, sourceName);
        case "toolResult":
            return parseToolResultMessage(value, sourceName);
        default:
            throw new Error(`Expected valid message role in ${sourceName}`);
    }
}

function parseUserMessage(
    value: Record<string, unknown>,
    sourceName: string,
): UserMessage {
    if (typeof value.content !== "string") {
        throw new Error(`Expected user content string in ${sourceName}`);
    }

    return {
        role: "user",
        content: value.content,
    };
}

function parseToolResultMessage(
    value: Record<string, unknown>,
    sourceName: string,
): ToolResultMessage {
    if (typeof value.toolCallId !== "string") {
        throw new Error(`Expected toolCallId string in ${sourceName}`);
    }

    if (typeof value.toolName !== "string") {
        throw new Error(`Expected toolName string in ${sourceName}`);
    }

    if (typeof value.content !== "string") {
        throw new Error(`Expected tool result content string in ${sourceName}`);
    }

    if (typeof value.isError !== "boolean") {
        throw new Error(`Expected isError boolean in ${sourceName}`);
    }

    return {
        role: "toolResult",
        toolCallId: value.toolCallId,
        toolName: value.toolName,
        content: value.content,
        isError: value.isError,
    };
}

function parseAssistantMessage(
    value: Record<string, unknown>,
    sourceName: string,
): AssistantMessage {
    if (!Array.isArray(value.content)) {
        throw new Error(`Expected assistant content array in ${sourceName}`);
    }

    if (typeof value.model !== "string") {
        throw new Error(`Expected assistant model string in ${sourceName}`);
    }

    return {
        role: "assistant",
        content: value.content.map((content, index) =>
            parseAssistantContent(content, `${sourceName}.content[${index}]`),
        ),
        model: value.model,
        usage: parseUsage(value.usage, `${sourceName}.usage`),
        stopReason: parseStopReason(value.stopReason, `${sourceName}.stopReason`),
        errorMessage: parseOptionalString(
            value.errorMessage,
            `${sourceName}.errorMessage`,
        ),
    };
}

function parseAssistantContent(
    value: unknown,
    sourceName: string,
): AssistantContent {
    if (!isRecord(value)) {
        throw new Error(`Expected assistant content object in ${sourceName}`);
    }

    switch (value.type) {
        case "text":
            return parseTextContent(value, sourceName);
        case "toolCall":
            return parseToolCallContent(value, sourceName);
        default:
            throw new Error(`Expected valid assistant content type in ${sourceName}`);
    }
}

function parseTextContent(
    value: Record<string, unknown>,
    sourceName: string,
): TextContent {
    if (typeof value.text !== "string") {
        throw new Error(`Expected text content string in ${sourceName}`);
    }

    return {
        type: "text",
        text: value.text,
    };
}

function parseToolCallContent(
    value: Record<string, unknown>,
    sourceName: string,
): ToolCallContent {
    if (typeof value.id !== "string") {
        throw new Error(`Expected tool call id string in ${sourceName}`);
    }

    if (typeof value.name !== "string") {
        throw new Error(`Expected tool call name string in ${sourceName}`);
    }

    return {
        type: "toolCall",
        id: value.id,
        name: value.name,
        arguments: parseJsonObjectValue(
            value.arguments,
            `${sourceName}.arguments`,
        ),
    };
}

function parseJsonObjectValue(
    value: unknown,
    sourceName: string,
): JsonObject {
    if (!isRecord(value)) {
        throw new Error(`Expected JSON object in ${sourceName}`);
    }

    const result: JsonObject = {};

    for (const [key, item] of Object.entries(value)) {
        result[key] = parseJsonValue(item, `${sourceName}.${key}`);
    }

    return result;
}

function parseJsonValue(value: unknown, sourceName: string): JsonValue {
    if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        value === null
    ) {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map((item, index) =>
            parseJsonValue(item, `${sourceName}[${index}]`),
        );
    }

    if (isRecord(value)) {
        return parseJsonObjectValue(value, sourceName);
    }

    throw new Error(`Expected JSON value in ${sourceName}`);
}

function parseUsage(value: unknown, sourceName: string): Usage | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (!isRecord(value)) {
        throw new Error(`Expected usage object in ${sourceName}`);
    }

    return {
        inputTokens: parseNumber(value.inputTokens, `${sourceName}.inputTokens`),
        outputTokens: parseNumber(value.outputTokens, `${sourceName}.outputTokens`),
        totalTokens: parseNumber(value.totalTokens, `${sourceName}.totalTokens`),
    };
}

function parseNumber(value: unknown, sourceName: string): number {
    if (typeof value !== "number") {
        throw new Error(`Expected number in ${sourceName}`);
    }

    return value;
}
function parseStopReason(value: unknown, sourceName: string): StopReason {
    if (
        value === "stop" ||
        value === "length" ||
        value === "toolUse" ||
        value === "error"
    ) {
        return value;
    }

    throw new Error(`Expected valid stopReason in ${sourceName}`);
}

function parseOptionalString(
    value: unknown,
    sourceName: string,
): string | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (typeof value !== "string") {
        throw new Error(`Expected optional string in ${sourceName}`);
    }

    return value;
}
