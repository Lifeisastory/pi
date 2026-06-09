import { getHelpText, parseArgs } from "./cli/args.js";
import { loadConfig } from "./config/config.js";

try {
  const parsed = parseArgs(process.argv.slice(2));

  if (parsed.help) {
    console.log(getHelpText());
    const config = loadConfig();
    console.log(JSON.stringify({ args: parsed, config }, null, 2));
  } else {
    console.log(JSON.stringify(parsed, null, 2));
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.log(message);
  process.exitCode = 1;
}
