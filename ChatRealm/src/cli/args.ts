export interface ParsedArgs {
  prompt: string | undefined;
  model: string | undefined;
  provider: string | undefined;
  cwd: string | undefined;
  help: boolean;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    prompt: undefined,
    model: undefined,
    provider: undefined,
    cwd: undefined,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
  const arg = argv[index];

  if (arg === "--help" || arg === "-h") {
    parsed.help = true;
    continue;
  }
}

  return parsed;
}