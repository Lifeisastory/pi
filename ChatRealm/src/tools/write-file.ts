import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { JsonObject } from "../ai/types.js";
import { resolveInsideCwd } from "./path.js";
import type { AgentTool } from "./types.js";

function readRequiredString(
    args: JsonObject,
    key: string,
    sourceName: string,
): string {
    const value = args[key];

    if (typeof value !== "string") {
        throw new Error(`Expected string for ${key} in ${sourceName}`);
    }

    return value;
}

function readOptionalBoolean(args: JsonObject, key: string): boolean | undefined {
    const value = args[key];

    if (value === undefined) {
        return undefined;
    }

    if (typeof value !== "boolean") {
        throw new Error(`Expected boolean for ${key}`);
    }

    return value;
}

export const writeFileTool: AgentTool = {
    definition: {
        name: "write_file",
        description: "Write a UTF-8 text file inside the current working directory.",
        parameters: {
            type: "object",
            properties: {
                path: {
                    type: "string",
                    description: "Relative path to the file to write.",
                },
                content: {
                    type: "string",
                    description: "Full UTF-8 text content to write.",
                },
                overwrite: {
                    type: "boolean",
                    description: "Whether to overwrite an existing file. Defaults to false.",
                },
            },
            required: ["path", "content"],
            additionalProperties: false,
        },
    },
    async execute(args, context) {
        try {
            const inputPath = readRequiredString(args, "path", "write_file arguments");
            const content = readRequiredString(args, "content", "write_file arguments");
            const overwrite = readOptionalBoolean(args, "overwrite") ?? false;
            const filePath = resolveInsideCwd(context.cwd, inputPath);

            await mkdir(dirname(filePath), { recursive: true });
            await writeFile(filePath, content, {
                encoding: "utf8",
                flag: overwrite ? "w" : "wx",
            });

            return {
                content: `Wrote ${content.length} characters to ${inputPath}`,
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