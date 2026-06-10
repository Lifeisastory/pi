import { readdir, readFile } from "node:fs/promises";
import { relative } from "node:path";
import type { JsonObject } from "../ai/types";
import type { AgentTool } from "./types";
import { resolveInsideCwd } from "./path";

const SKIPPED_DIRECTORIES = new Set([
    ".git",
    "node_modules",
    "dist",
    "build",
    ".next",
    "coverage",
]);

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

function readOptionalString(args: JsonObject, key: string): string | undefined {
    const value = args[key];

    if (value === undefined) {
        return undefined;
    }

    if (typeof value !== "string") {
        throw new Error(`Expected string for ${key}`);
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

export const searchTool: AgentTool = {
    definition: {
        name: "search",
        description: "Search UTF-8 text files inside the current working directory.",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "Plain text to search for.",
                },
                path: {
                    type: "string",
                    description: "Optional relative directory to search. Defaults to the current working directory.",
                },
                maxResults: {
                    type: "number",
                    description: "Optional maximum number of matches to return. Defaults to 50.",
                },
            },
            required: ["query"],
            additionalProperties: false,
        },
    },
    async execute(args, context) {
        try {
            const query = readRequiredString(args, "query", "search arguments");
            const inputPath = readOptionalString(args, "path") ?? ".";
            const maxResults = Math.max(
                1,
                Math.min(100, Math.floor(readOptionalNumber(args, "maxResults") ?? 50)),
            );
            const root = resolveInsideCwd(context.cwd, inputPath);
            const results: string[] = [];

            await searchDirectory(root, root, query, results, maxResults);

            return {
                content: results.length > 0 ? results.join("\n") : "No matches found.",
                isError: false,
            };
        } catch (error) {
            return {
                content: error instanceof Error ? error.message : String(error),
                isError: true,
            };
        }
    }
};

async function searchDirectory(
    root: string,
    directory: string,
    query: string,
    results: string[],
    maxResults: number,
): Promise<void> {
    if (results.length >= maxResults) {
        return;
    }

    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
        if (results.length >= maxResults) {
            return;
        }

        if (entry.isDirectory()) {
            if (SKIPPED_DIRECTORIES.has(entry.name)) {
                continue;
            }

            await searchDirectory(
                root,
                resolveInsideCwd(directory, entry.name),
                query,
                results,
                maxResults,
            );
            continue;
        }

        if (!entry.isFile()) {
            continue;
        }

        await searchFile(root, resolveInsideCwd(directory, entry.name), query, results, maxResults);
    }
}

async function searchFile(
    root: string,
    filePath: string,
    query: string,
    results: string[],
    maxResults: number,
): Promise<void> {
    let content: string;

    try {
        content = await readFile(filePath, "utf8");
    } catch {
        return;
    }

    const lines = content.split(/\r?\n/);

    for (const [index, line] of lines.entries()) {
        if (results.length >= maxResults) {
            return;
        }

        if (line.includes(query)) {
            results.push(`${relative(root, filePath)}:${index + 1}: ${line.trim()}`);
        }
    }
}
