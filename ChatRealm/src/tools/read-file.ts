import { readFile } from "node:fs/promises";
import type { JsonObject } from "../ai/types";
import type { AgentTool } from "./types";
import { resolveInsideCwd } from "./path";

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

export const readFileTool: AgentTool = {
    definition: {
        name: "read_file",
        description: "Read a UTF-8 text file inside the current working directory.",
        parameters: {
            type: "object",
            properties: {
                path: {
                    type: "string",
                    description: "Relative path to the file to read.",
                },
            },
            required: ["path"],
            additionalProperties: false,
        },
    }, async execute(args, context) {
        try {
            const inputPath = readRequiredString(args, "path", "read_file arguments");
            const filePath = resolveInsideCwd(context.cwd, inputPath);
            const content = await readFile(filePath, "utf8");

            return {
                content,
                isError: false,
            };
        } catch (error) {
            return {
                content: error instanceof Error ? error.message : String(error),
                isError: true,
            };
        }
    },
};
