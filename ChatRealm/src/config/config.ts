import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { SUPPORTED_CHAT_APIS, type ChatApi } from "../ai/types";
import { parseJsonObject, readOptionalString } from "../utils/json";

export interface AppConfig {
    api: ChatApi;
    apiKey: string | undefined;
    baseUrl: string | undefined;
    model: string | undefined;
    cwd: string;
}

export interface LoadConfigOptions {
    env?: Record<string, string | undefined>;
    cwd?: string;
}

export function loadConfig(options: LoadConfigOptions = {}): AppConfig {
    const env = options.env ?? process.env;
    const cwd = options.cwd ?? process.cwd();
    const configPath = env.CHATREALM_CONFIG ?? resolve(cwd, "chatrealm.config.json");

    let fileConfig: Record<string, unknown> = {};

    if (existsSync(configPath)) {
        const text = readFileSync(configPath, "utf8");
        fileConfig = parseJsonObject(text, configPath);
    }

    const fileApi = readOptionalString(fileConfig, "api", configPath);
    const fileApiKey = readOptionalString(fileConfig, "apiKey", configPath);
    const fileBaseUrl = readOptionalString(fileConfig, "baseUrl", configPath);
    const fileModel = readOptionalString(fileConfig, "model", configPath);
    const fileCwd = readOptionalString(fileConfig, "cwd", configPath);
    const apiSource = env.CHATREALM_API === undefined ? configPath : "CHATREALM_API";

    const config: AppConfig = {
        api: parseChatApi(env.CHATREALM_API ?? fileApi, apiSource),
        apiKey: env.CHATREALM_API_KEY ?? fileApiKey,
        baseUrl: env.CHATREALM_BASE_URL ?? fileBaseUrl,
        model: env.CHATREALM_MODEL ?? fileModel,
        cwd: env.CHATREALM_CWD ?? fileCwd ?? cwd,
    };

    return config;
}

function parseChatApi(value: string | undefined, sourceName: string): ChatApi {
    if (value === undefined || value.trim() === "") {
        throw new Error(`Missing api in ${sourceName}. Expected one of: ${formatSupportedChatApis()}`);
    }

    if (isSupportedChatApi(value)) {
        return value;
    }

    throw new Error(`Unsupported api in ${sourceName}: ${value}. Expected one of: ${formatSupportedChatApis()}`);
}

function isSupportedChatApi(value: string): value is ChatApi {
    return SUPPORTED_CHAT_APIS.includes(value as ChatApi);
}

function formatSupportedChatApis(): string {
    return SUPPORTED_CHAT_APIS.join(", ");
}
