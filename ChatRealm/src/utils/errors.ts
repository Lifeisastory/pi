export type UserFacingErrorCategory =
    | "usage"
    | "config"
    | "provider"
    | "session"
    | "agent"
    | "tool"
    | "unknown";

export interface FormattedCliError {
    message: string;
    exitCode: number;
}

export class UserFacingError extends Error {
    readonly category: UserFacingErrorCategory;
    readonly exitCode: number;

    constructor(
        category: UserFacingErrorCategory,
        message: string,
        options: { exitCode?: number; cause?: unknown } = {},
    ) {
        super(message, { cause: options.cause });
        this.name = "UserFacingError";
        this.category = category;
        this.exitCode = options.exitCode ?? 1;
    }
}

function categoryLabel(category: UserFacingErrorCategory): string {
    switch (category) {
        case "usage":
            return "Usage error";
        case "config":
            return "Config error";
        case "provider":
            return "Provider error";
        case "session":
            return "Session error";
        case "agent":
            return "Agent error";
        case "tool":
            return "Tool error";
        case "unknown":
            return "Unexpected error";
    }
}

export function formatCliError(error: unknown): FormattedCliError {
    if (error instanceof UserFacingError) {
        return {
            message: `${categoryLabel(error.category)}: ${error.message}`,
            exitCode: error.exitCode,
        };
    }

    if (error instanceof Error) {
        return {
            message: `${categoryLabel("unknown")}: ${error.message}`,
            exitCode: 1,
        };
    }

    return {
        message: `${categoryLabel("unknown")}: ${String(error)}`,
        exitCode: 1,
    };
}

export function toUserFacingError(
    category: UserFacingErrorCategory,
    error: unknown,
    fallbackMessage: string,
): UserFacingError {
    if (error instanceof UserFacingError) {
        return error;
    }

    if (error instanceof Error) {
        return new UserFacingError(category, error.message, { cause: error });
    }

    return new UserFacingError(category, fallbackMessage, { cause: error });
}