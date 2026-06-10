import { exec, type ExecException } from "node:child_process";
import type { JsonObject } from "../ai/types";
import type { AgentTool } from "./types";

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_TIMEOUT_MS = 120_000;
const MAX_BUFFER_BYTES = 1024 * 1024;

function readRequiredString(
    args: JsonObject,
    key: string,
    sourceName: string,
): string {
    const value = args[key];

    if (typeof value !== "string" || value.trim() === "") {
        throw new Error(`Expected non-empty string for ${key} in ${sourceName}`);
    }

    return value;
}

function readOptionalNumber(args: JsonObject, key: string): number | undefined {
    const value = args[key];

    if (value === undefined) {
        return undefined;
    }

    if (typeof value !== "number") {
        throw new Error(`Expected number for ${key}`);
    }

    return value;
}

function clampTimeout(timeoutMs: number | undefined): number {
    if (timeoutMs === undefined) {
        return DEFAULT_TIMEOUT_MS;
    }

    return Math.max(1_000, Math.min(MAX_TIMEOUT_MS, Math.floor(timeoutMs)));
}

interface ShellExecution {
    stdout: string;
    stderr: string;
    exitCode: number;
}

function runShellCommand(
    command: string,
    cwd: string,
    timeoutMs: number,
): Promise<ShellExecution> {
    return new Promise((resolve) => {
        exec(
            command,
            {
                cwd,
                timeout: timeoutMs,
                maxBuffer: MAX_BUFFER_BYTES,
            },
            (error: ExecException | null, stdout, stderr) => {
                resolve({
                    stdout,
                    stderr,
                    exitCode: getExitCode(error),
                });
            },
        );
    });
}

function getExitCode(error: ExecException | null): number {
    if (error === null) {
        return 0;
    }

    if (typeof error.code === "number") {
        return error.code;
    }

    return 1;
}

function formatShellResult(result: ShellExecution): string {
    return [
        `Exit code: ${result.exitCode}`,
        "",
        "stdout:",
        result.stdout.trim() === "" ? "(empty)" : result.stdout.trimEnd(),
        "",
        "stderr:",
        result.stderr.trim() === "" ? "(empty)" : result.stderr.trimEnd(),
    ].join("\n");
}

export const shellTool: AgentTool = {
    definition: {
        name: "shell_command",
        description: "Run a shell command in the current working directory and return stdout, stderr, and exit code.",
        parameters: {
            type: "object",
            properties: {
                command: {
                    type: "string",
                    description: "Shell command to run.",
                },
                timeoutMs: {
                    type: "number",
                    description: "Optional timeout in milliseconds. Defaults to 30000.",
                },
            },
            required: ["command"],
            additionalProperties: false,
        },
    },
    async execute(args, context) {
        try {
            const command = readRequiredString(args, "command", "shell_command arguments");
            const timeoutMs = clampTimeout(readOptionalNumber(args, "timeoutMs"));
            const result = await runShellCommand(command, context.cwd, timeoutMs);

            return {
                content: formatShellResult(result),
                isError: result.exitCode !== 0,
            };
        } catch (error) {
            return {
                content: error instanceof Error ? error.message : String(error),
                isError: true,
            };
        }
    }
};
