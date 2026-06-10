import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { parseJsonObject, readOptionalString } from "../utils/json";

export interface AppConfig {
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

    const fileApiKey = readOptionalString(fileConfig, "apiKey", configPath);
    const fileBaseUrl = readOptionalString(fileConfig, "baseUrl", configPath);
    const fileModel = readOptionalString(fileConfig, "model", configPath);
    const fileCwd = readOptionalString(fileConfig, "cwd", configPath);

    const config: AppConfig = {
        apiKey: env.CHATREALM_API_KEY ?? fileApiKey,
        baseUrl: env.CHATREALM_BASE_URL ?? fileBaseUrl,
        model: env.CHATREALM_MODEL ?? fileModel,
        cwd: env.CHATREALM_CWD ?? fileCwd ?? cwd,
    };

    return config;
}
