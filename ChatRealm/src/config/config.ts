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