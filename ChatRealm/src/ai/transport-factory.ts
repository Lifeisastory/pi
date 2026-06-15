import { createAnthropicMessagesTransport } from "./anthropic-messages";
import { createOpenAICompletionsTransport } from "./openai-completions";
import { createOpenAIResponsesTransport } from "./openai-responses";
import type { ChatApi, ChatTransport } from "./types";

export interface CreateChatTransportOptions {
    api: ChatApi;
    apiKey: string;
    baseUrl: string | undefined;
}

interface TransportCreatorOptions {
    apiKey: string;
    baseUrl: string | undefined;
}

type TransportCreator = (options: TransportCreatorOptions) => ChatTransport;

const TRANSPORT_CREATORS: Partial<Record<ChatApi, TransportCreator>> = {
    "anthropic-messages": createAnthropicMessagesTransport,
    "openai-completions": createOpenAICompletionsTransport,
    "openai-responses": createOpenAIResponsesTransport,
};

export function createChatTransport(
    options: CreateChatTransportOptions,
): ChatTransport {
    const createTransport = TRANSPORT_CREATORS[options.api];

    if (createTransport === undefined) {
        throw new Error(`Chat API is not implemented yet: ${options.api}`);
    }

    return createTransport({
        apiKey: options.apiKey,
        baseUrl: options.baseUrl,
    });
}
