export interface ParsedArgs {
  prompt: string | undefined;
  model: string | undefined;
  provider: string | undefined;
  cwd: string | undefined;
  help: boolean;
}

// 命令行参数解析
export function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    prompt: undefined,
    model: undefined,
    provider: undefined,
    cwd: undefined,
    help: false,
  };

  const positionalParts: string[] = [];

  // 辅助读取带值参数的值
  const readValue = (flag: string, index: number): string => {
    const value = argv[index + 1];

    if (value === undefined) {
      throw new Error(`Missing value for ${flag}`);
    }

    return value;
  };

  // 解析参数flag
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }
    if (arg === "--prompt" || arg === "-p") {
      parsed.prompt = readValue(arg, index);
      index += 1;
      continue;
    }
    if (arg === "--model") {
      parsed.model = readValue(arg, index);
      index += 1;
      continue;
    }
    if (arg === "--provider") {
      parsed.provider = readValue(arg, index);
      index += 1;
      continue;
    }
    if (arg === "--cwd") {
      parsed.cwd = readValue(arg, index);
      index += 1;
      continue;
    }

    // 处理不受支持的参数
    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    //处理位置参数
    positionalParts.push(arg);
  }

  if (parsed.prompt === undefined && positionalParts.length > 0) {
    parsed.prompt = positionalParts.join(" ");
  }

  return parsed;
}

// 获取帮助函数
export function getHelpText(): string {
    return [
    "Usage:",
    "  agent [options] [prompt]",
    "",
    "Options:",
    "  -p, --prompt <text>     Prompt text to send to the agent",
    "  --model <name>          Model name override",
    "  --provider <name>       Provider name override",
    "  --cwd <path>            Working directory override",
    "  -h, --help              Show help",
  ].join("\n");
}
