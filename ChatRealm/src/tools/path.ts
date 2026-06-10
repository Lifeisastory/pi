import { isAbsolute, relative, resolve } from "node:path";

export function resolveInsideCwd(cwd: string, inputPath: string): string {
    if (inputPath.trim() === "") {
        throw new Error("Path cannot be empty");
    }

    if (isAbsolute(inputPath)) {
        throw new Error("Path must be relative");
    }

    const root = resolve(cwd);
    const target = resolve(root, inputPath);
    const relativePath = relative(root, target);

    if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
        throw new Error(`Path escapes cwd: ${inputPath}`);
    }

    return target;
}