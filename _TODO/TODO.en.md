# 
    MVP Agent Implementation Plan

## Artifact Metadata

- Artifact: project-todo
- Language: English
- Canonical: true
- Project type: greenfield TypeScript CLI application
- Reference project: pi monorepo architecture index

## Project Summary

Build a minimal but real coding agent inspired by `pi`. The MVP project is `ChatRealm`. It should run from a terminal, accept a user prompt, call an LLM provider, optionally use a small set of local tools, maintain a simple conversation state, and print useful results. The goal is learning by rebuilding the core architecture in small steps, not cloning every production feature.

## Scope

### In Scope

- TypeScript CLI application.
- Print mode first: `agent "your task"` or `agent -p "your task"`.
- Minimal LLM adapter abstraction.
- One OpenAI-compatible chat/completions provider.
- Agent loop with tool-call support.
- A small tool registry with filesystem read, filesystem write, grep/search, and shell command tools.
- JSON session persistence for basic conversation history.
- Basic config loading from environment variables and a local config file.
- Focused tests for parser, tool registry, and agent loop behavior.

### Out of Scope

- Full TUI.
- RPC mode.
- Plugin marketplace or skill system.
- Multi-provider production registry.
- Streaming renderer.
- Session compaction.
- Image generation.
- Binary packaging.

## Planned Structure

```text
ChatRealm/
  package.json
  tsconfig.json
  src/
    main.ts
    cli/
      args.ts
    config/
      config.ts
    ai/
      types.ts
      openai-compatible.ts
    agent/
      agent.ts
      agent-loop.ts
      state.ts
      prompt.ts
    tools/
      types.ts
      registry.ts
      read-file.ts
      write-file.ts
      search.ts
      shell.ts
    session/
      store.ts
    utils/
      errors.ts
      json.ts
  test/
    cli-args.test.ts
    tool-registry.test.ts
    agent-loop.test.ts
```

## Ordered TODO Items

### TODO-001: Scaffold TypeScript CLI Project

- Status: completed
- Goal: Create a minimal standalone TypeScript CLI project that can be installed, type-checked, and executed locally before any agent logic exists.
- Scope:
  - Created the `ChatRealm/` project directory.
  - Added npm package metadata and scripts.
  - Added a strict TypeScript configuration.
  - Added the first `src/main.ts` CLI entrypoint.
  - Made the CLI print a placeholder message and exit successfully.
  - Do not implement argument parsing, config loading, provider calls, tools, sessions, or tests yet.
- Likely files or areas: `ChatRealm/package.json`, `ChatRealm/tsconfig.json`, `ChatRealm/src/main.ts`, optional `ChatRealm/README.md`
- Dependencies: none
- Suggested package choices:
  - Runtime: Node.js with TypeScript.
  - Module system: ESM.
  - Direct dependencies: none for this TODO unless your local runner requires one.
  - Dev dependencies: `typescript` and one TypeScript runner such as `tsx`.
- Step-by-step implementation guide:
  1. Create the project folder.
     - From the repository root, create `mvp-agent/`.
     - All files for this learning project should live under `mvp-agent/`.
  2. Initialize npm metadata.
     - Run `npm init -y` inside `mvp-agent/`, or create `package.json` manually.
     - Set a clear package name such as `mvp-agent`.
     - Set `"type": "module"` so Node treats generated JavaScript as ESM.
     - Keep `"private": true` because this MVP is not ready to publish.
  3. Install development dependencies.
     - From `mvp-agent/`, install TypeScript tooling with `npm install --save-dev --ignore-scripts typescript tsx`.
     - Do not add runtime dependencies in TODO-001.
  4. Add npm scripts to `package.json`.
     - Add `"check": "tsc --noEmit"`.
     - Add `"dev": "tsx src/main.ts"`.
     - Add `"start": "tsx src/main.ts"`.
     - For now, `dev` and `start` can be the same because there is no build output yet.
  5. Create `tsconfig.json`.
     - Use strict TypeScript settings.
     - Set `target` to a modern Node-compatible value such as `ES2022`.
     - Set `module` and `moduleResolution` to Node ESM-compatible values.
     - Include only `src/**/*.ts` for now.
     - Do not configure test files yet.
     - Recommended starting content:
       ```json
       {
         "compilerOptions": {
           "target": "ES2022",
           "module": "NodeNext",
           "moduleResolution": "NodeNext",
           "strict": true,
           "noEmit": true,
           "esModuleInterop": true,
           "forceConsistentCasingInFileNames": true,
           "skipLibCheck": true
         },
         "include": ["src/**/*.ts"]
       }
       ```
     - Field explanations:
       - `target`: tells TypeScript which JavaScript language level to type-check against. `ES2022` is a good baseline for modern Node.
       - `module`: tells TypeScript how modules are interpreted. `NodeNext` matches Node's modern ESM behavior.
       - `moduleResolution`: tells TypeScript how to find imported files and packages. Use `NodeNext` together with `module: NodeNext`.
       - `strict`: enables the important TypeScript safety checks. Keep this on from the start.
       - `noEmit`: prevents `tsc` from generating JavaScript files. In this MVP step, `tsx` runs the `.ts` file directly.
       - `esModuleInterop`: makes CommonJS package interop smoother later.
       - `forceConsistentCasingInFileNames`: catches path casing mistakes that may work on Windows but fail on Linux/macOS.
       - `skipLibCheck`: skips type-checking dependency declaration files, which keeps beginner feedback focused on your own code.
       - `include`: limits TypeScript checking to source files under `src/`.
     - Important beginner rule:
       - `tsconfig.json` does not run your program. It only configures how TypeScript checks your program.
       - `npm run check` uses this file through `tsc --noEmit`.
       - `npm run dev` uses `tsx src/main.ts` to run the program.
  6. Create the source directory.
     - Create `src/`.
     - Create `src/main.ts`.
  7. Add the first CLI entrypoint.
     - In `src/main.ts`, print a single placeholder line.
     - Keep the file simple; `console.log("mvp-agent: ready");` is enough.
     - Do not read `process.argv` yet; TODO-002 will add argument parsing.
  8. Run the first verification.
     - Run `npm run check`.
     - Run `npm run dev`.
     - Run `npm start`.
     - Fix any TypeScript or script errors before moving on.
  9. Inspect the final scaffold.
     - Confirm the folder contains only the minimum files needed for this TODO.
     - Expected files are `package.json`, `package-lock.json`, `tsconfig.json`, `src/main.ts`, and `node_modules/` after install.
     - `node_modules/` should exist locally but should not be committed in a real git project.
- Minimal expected file contents:
  - `package.json` should contain package metadata, `"type": "module"`, `"private": true`, and the three scripts above.
  - `tsconfig.json` should enable strict type checking and include `src/**/*.ts`.
  - `src/main.ts` should only print the placeholder message.
- Beginner notes:
  - `package.json` describes how npm runs the project.
  - `tsconfig.json` tells TypeScript how strict to be and which files to check.
  - `tsx` lets Node run `.ts` files directly during development.
  - `tsc --noEmit` checks types without creating JavaScript output files.
  - ESM means using modern `import` and `export` syntax later.
- Required npm scripts:
  - `check`: run TypeScript type checking without emitting files.
  - `dev`: run `src/main.ts` directly for local development.
  - `start`: run the CLI entrypoint in the same placeholder mode for now.
- Implementation notes:
  - Keep `src/main.ts` intentionally small.
  - The placeholder output should make it obvious the binary is alive, for example `mvp-agent: ready`.
  - Avoid adding CLI parsing now; TODO-002 owns that.
  - Avoid adding AI/config/tool abstractions now; later TODOs own those boundaries.
- Acceptance criteria:
  - `npm install --ignore-scripts` succeeds from inside `mvp-agent/`.
  - `npm run check` succeeds.
  - `npm run dev` prints the placeholder message and exits with code 0.
  - `npm start` prints the placeholder message and exits with code 0.
  - `package.json` uses ESM via `"type": "module"`.
  - `tsconfig.json` has strict type checking enabled.
  - The project has no unused placeholder modules or broad abstractions.
  - The files created are limited to the scaffold needed for this TODO.
- Reviewer checklist:
  - Confirm the project is standalone and does not depend on the parent `pi` workspace.
  - Confirm TypeScript strict mode is enabled.
  - Confirm there are no dynamic imports or non-erasable TypeScript syntax.
  - Confirm the scaffold leaves clean extension points for TODO-002 without pre-implementing it.

### TODO-002: Implement CLI Argument Parsing

- Status: completed
- Goal: Teach the CLI to understand user input from the terminal without starting any real agent logic yet.
- Scope:
  - Add a small argument parser in `src/cli/args.ts`.
  - Support prompt input through `-p "text"` and `--prompt "text"`.
  - Support prompt input through positional text, for example `npm run dev -- "say hi"`.
  - Support optional flags: `--model`, `--provider`, and `--cwd`.
  - Support `--help` and `-h`.
  - Update `src/main.ts` to call the parser and print the parsed result.
  - Do not load config, call an LLM, run tools, or persist sessions.
- Likely files or areas: `ChatRealm/src/cli/args.ts`, `ChatRealm/src/main.ts`
- Dependencies: TODO-001
- Step-by-step implementation guide:
  1. Create the CLI folder.
     - Create `src/cli/`.
     - Create `src/cli/args.ts`.
  2. Define the parsed argument type.
     - Add an exported interface named `ParsedArgs`.
     - It should contain:
       - `prompt: string | undefined`
       - `model: string | undefined`
       - `provider: string | undefined`
       - `cwd: string | undefined`
       - `help: boolean`
     - Use `undefined` for values the user did not provide.
     - Put this type near the top of `src/cli/args.ts`.
     - Recommended code:
       ```ts
       export interface ParsedArgs {
         prompt: string | undefined;
         model: string | undefined;
         provider: string | undefined;
         cwd: string | undefined;
         help: boolean;
       }
       ```
     - Why this interface exists:
       - The parser receives raw strings from the terminal.
       - The rest of the program should not work with raw strings directly.
       - `ParsedArgs` is the clean shape that later code can trust.
     - Why each field exists:
       - `prompt`: the user's task text, for example `write a greeting`.
       - `model`: optional model override, for example `gpt-4.1-mini`.
       - `provider`: optional provider override, for example `openai-compatible`.
       - `cwd`: optional working directory override.
       - `help`: whether the user requested help output.
     - Why use `string | undefined`:
       - `string` means the user provided a value.
       - `undefined` means the user did not provide that option.
       - This is clearer than using an empty string because an empty string can also be a real user input.
     - Why `help` is only `boolean`:
       - Help is either requested or not requested.
       - It does not need a string value.
     - What not to do:
       - Do not use `any`.
       - Do not make every field optional with `?` in this TODO; explicit `undefined` makes the parser result easier to inspect while learning.
       - Do not put runtime logic inside the interface. Interfaces are TypeScript-only type declarations.
  3. Define a parser function.
     - Export a function named `parseArgs`.
     - Suggested signature: `parseArgs(argv: string[]): ParsedArgs`.
     - The input should be only the user arguments, not the full `process.argv`.
     - Later, `main.ts` can call it with `process.argv.slice(2)`.
     - Recommended function skeleton:
       ```ts
       export function parseArgs(argv: string[]): ParsedArgs {
         const parsed: ParsedArgs = {
           prompt: undefined,
           model: undefined,
           provider: undefined,
           cwd: undefined,
           help: false,
         };

         return parsed;
       }
       ```
     - What `argv` means:
       - `argv` is short for "argument vector".
       - It is just an array of strings.
       - For `npm run dev -- --prompt "hello"`, the parser should receive `["--prompt", "hello"]`.
       - For `npm run dev -- write a greeting`, the parser should receive `["write", "a", "greeting"]`.
     - Why `parseArgs` should not read `process.argv` directly:
       - A pure function is easier to understand.
       - A pure function is easier to test later.
       - `main.ts` owns Node-specific details like `process.argv`.
       - `args.ts` should only know how to transform `string[]` into `ParsedArgs`.
     - How this function should evolve in later steps:
       - Start with the skeleton above.
       - Step 4 adds `--help` and `-h`.
       - Step 5 adds flags with values.
       - Step 6 adds positional prompt handling.
       - Step 7 adds unknown flag errors.
     - Beginner debugging tip:
       - While building the parser, you can temporarily add `console.log(argv)` in `main.ts`, not inside the final parser.
       - Remove temporary debug output before asking for review.
     - What not to do:
       - Do not make `parseArgs` async; no I/O is needed.
       - Do not mutate `process.argv`.
       - Do not exit the process from inside `parseArgs`.
       - Do not print help text from inside `parseArgs`; it should only return data or throw an error.
  4. Handle boolean help flags first.
     - If an argument is `--help` or `-h`, set `help: true`.
     - Help can appear together with other arguments, but `main.ts` should show help and stop.
     - Recommended approach:
       - Use a `for` loop over `argv`.
       - Read the current argument into a variable such as `arg`.
       - If `arg === "--help" || arg === "-h"`, set `parsed.help = true`.
       - Continue the loop so other arguments can still be scanned.
     - Example code shape:
       ```ts
       for (let index = 0; index < argv.length; index += 1) {
         const arg = argv[index];

         if (arg === "--help" || arg === "-h") {
           parsed.help = true;
           continue;
         }
       }
       ```
     - Why handle help early:
       - Help does not need a following value.
       - Help should be accepted even if the user only runs `--help`.
       - `main.ts` can later decide to print usage and skip normal execution.
     - Expected examples:
       - `parseArgs(["--help"])` should produce `help: true`.
       - `parseArgs(["-h"])` should produce `help: true`.
       - `parseArgs(["--help", "--model", "demo"])` should still produce `help: true`.
     - What not to do:
       - Do not call `console.log` here.
       - Do not call `process.exit` here.
       - Do not return early just because help is present; later steps can still parse the rest consistently.
  5. Handle value flags.
     - `-p` and `--prompt` consume the next argument as the prompt text.
     - `--model` consumes the next argument as the model.
     - `--provider` consumes the next argument as the provider.
     - `--cwd` consumes the next argument as the cwd.
     - If a value flag is missing its value, throw an `Error` with a clear message, for example `Missing value for --model`.
     - A value flag is an option that must be followed by another argument.
       - In `["--model", "demo-model"]`, `--model` is the flag and `demo-model` is its value.
       - In `["-p", "hello"]`, `-p` is the flag and `hello` is its value.
     - Add a small helper inside `parseArgs` to read the next value:
       ```ts
       const readValue = (flag: string, index: number): string => {
         const value = argv[index + 1];

         if (value === undefined) {
           throw new Error(`Missing value for ${flag}`);
         }

         return value;
       };
       ```
     - Then use it inside the loop:
       ```ts
       if (arg === "-p" || arg === "--prompt") {
         parsed.prompt = readValue(arg, index);
         index += 1;
         continue;
       }

       if (arg === "--model") {
         parsed.model = readValue(arg, index);
         index += 1;
         continue;
       }
       ```
     - Why `index += 1` is needed:
       - The next array item has already been consumed as this flag's value.
       - Without `index += 1`, the loop would later treat the value as a positional prompt.
     - Repeat the same pattern for:
       - `--provider`
       - `--cwd`
     - Missing value examples that should throw:
       - `parseArgs(["--model"])`
       - `parseArgs(["--provider"])`
       - `parseArgs(["--cwd"])`
       - `parseArgs(["-p"])`
     - Beginner edge case:
       - For this MVP, if the next value starts with `-`, you may still accept it as the value.
       - Example: `--prompt --help` can parse prompt as `"--help"`.
       - This keeps the first parser simple. More advanced validation can come later.
     - What not to do:
       - Do not silently ignore missing values.
       - Do not default missing values to an empty string.
       - Do not put provider/model defaults here; config loading belongs to TODO-003.
       - Do not support `--model=demo` yet unless you intentionally document it. Space-separated values are enough for this TODO.
  6. Handle positional prompt text.
     - Any argument that is not a known flag should become part of the positional prompt.
     - Join positional prompt parts with a single space.
     - Example: `["write", "a", "haiku"]` becomes `prompt: "write a haiku"`.
     - If `-p/--prompt` was already provided, prefer the explicit prompt and ignore positional prompt for now.
     - What "positional" means:
       - A positional argument is an argument that is not attached to a flag name.
       - In `agent --model demo write a greeting`, `--model` is a flag, `demo` is the flag value, and `write`, `a`, `greeting` are positional prompt parts.
       - In `agent "write a greeting"`, the whole `"write a greeting"` string is one positional argument.
     - Add a local array to collect positional parts:
       ```ts
       const positionalParts: string[] = [];
       ```
     - Put this array near the top of `parseArgs`, after the `parsed` object and before the loop.
     - Inside the loop, after all known flag checks, treat the current argument as positional text:
       ```ts
       positionalParts.push(arg);
       ```
     - At this point in the loop, `arg` is safe to collect because:
       - `--help` and `-h` already used `continue`.
       - Value flags such as `--model demo` already consumed their value and used `continue`.
       - Known flags have already been handled.
     - After the loop finishes, convert collected parts into the final prompt:
       ```ts
       if (parsed.prompt === undefined && positionalParts.length > 0) {
         parsed.prompt = positionalParts.join(" ");
       }
       ```
     - Why this happens after the loop:
       - The parser needs to see every argument before it knows all positional parts.
       - Joining once at the end is simpler than repeatedly changing `parsed.prompt` inside the loop.
       - It keeps explicit prompt handling easy: `-p "hello"` wins over positional text.
     - Why check `parsed.prompt === undefined`:
       - `-p` and `--prompt` are explicit user choices.
       - Explicit prompt should win over positional text for this MVP.
       - Example: `agent -p "hello" ignored words` should keep `prompt: "hello"` for now.
     - Manual examples to think through:
       - `parseArgs(["write", "a", "haiku"])` should return `prompt: "write a haiku"`.
       - `parseArgs(["--model", "demo", "write", "a", "haiku"])` should return `model: "demo"` and `prompt: "write a haiku"`.
       - `parseArgs(["-p", "hello", "ignored"])` should return `prompt: "hello"`.
       - `parseArgs([])` should leave `prompt: undefined`.
     - Beginner debugging tip:
       - If a flag value accidentally appears in the prompt, check whether you forgot `index += 1` after reading that flag's value.
       - If all positional text disappears, check whether `positionalParts.push(arg)` is placed before a `continue` that skips it.
     - What not to do:
       - Do not join `argv` directly; that would accidentally include flags like `--model`.
       - Do not make positional text overwrite `-p` or `--prompt`.
       - Do not trim or validate the prompt yet unless you intentionally document that behavior.
       - Do not add config defaults here; this parser should only reflect what the user typed.
  7. Handle unknown flags.
     - If an argument starts with `-` and is not supported, throw an `Error`.
     - Example message: `Unknown option: --bad`.
     - Why this step exists:
       - Without unknown flag handling, a typo like `--modle demo` would be treated as positional prompt text.
       - That would hide the user's mistake and make the CLI behave unpredictably.
       - A CLI should fail fast when it sees an option it does not understand.
     - Where to put this check:
       - Put it inside the `for` loop.
       - Put it after all supported flags have been checked.
       - Put it before `positionalParts.push(arg)`.
     - The order should look like this:
       ```ts
       for (let index = 0; index < argv.length; index += 1) {
         const arg = argv[index];

         if (arg === "--help" || arg === "-h") {
           parsed.help = true;
           continue;
         }

         if (arg === "-p" || arg === "--prompt") {
           parsed.prompt = readValue(arg, index);
           index += 1;
           continue;
         }

         // Other known flags go here.

         if (arg.startsWith("-")) {
           throw new Error(`Unknown option: ${arg}`);
         }

         positionalParts.push(arg);
       }
       ```
     - Why `startsWith("-")` is enough for this MVP:
       - CLI flags normally start with `-`, such as `-p` or `--model`.
       - Positional prompt text normally does not start with `-`.
       - This simple rule catches common mistakes without adding a complex parser.
     - Important edge case:
       - In this MVP, prompt words that start with `-` will be rejected if they are positional text.
       - Example: `agent explain --not-a-real-flag` should throw `Unknown option: --not-a-real-flag`.
       - If the user really needs prompt text that starts with `-`, they can use `-p "--not-a-real-flag"` because Step 5 accepts flag values even when they start with `-`.
     - Manual examples:
       - `parseArgs(["--bad"])` should throw `Unknown option: --bad`.
       - `parseArgs(["--model", "demo", "--bad"])` should throw `Unknown option: --bad`.
       - `parseArgs(["write", "--bad"])` should throw `Unknown option: --bad`.
       - `parseArgs(["-p", "--bad"])` should return `prompt: "--bad"` because `--bad` is the value consumed by `-p`.
       - `parseArgs(["--prompt", "--bad"])` should return `prompt: "--bad"` for the same reason.
     - How to verify from `main.ts` after parser output is wired:
       - `npm run dev -- -- --bad`
       - Expected terminal output should contain `Unknown option: --bad`.
       - The process should exit with a non-zero status because `main.ts` sets `process.exitCode = 1` in the `catch` block.
     - Beginner debugging tip:
       - If `--bad` appears inside the printed JSON prompt, the unknown flag check is probably after `positionalParts.push(arg)` or missing.
       - If `-p --bad` throws an unknown option error, the unknown flag check is probably running before the `-p` branch consumes its value.
     - What not to do:
       - Do not silently ignore unknown flags.
       - Do not add unknown flags to `positionalParts`.
       - Do not support aliases that are not listed in the TODO.
       - Do not add a third-party argument parser yet; the goal is to learn the mechanics first.
  8. Add a help text function.
     - Export a function named `getHelpText` from `src/cli/args.ts`.
     - Keep this function separate from `parseArgs`: `parseArgs` parses input, while `getHelpText` returns display text.
     - The function should not print, exit the process, read files, or accept arguments in this TODO.
     - Use an array of strings with `join("\n")` so the Markdown code block stays easy to read.
     - Recommended implementation:

       ```ts
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
       ```
     - In this usage text, `[options]` and `[prompt]` mean those parts are optional.
     - Keep the help text limited to features that exist in TODO-002. Do not mention config files, LLM calls, tools, sessions, or future modes yet.
     - Step 9 will use the function from `main.ts` like this:

       ```ts
       if (parsed.help) {
         console.log(getHelpText());
         return;
       }
       ```
     - Manual checks after Step 9 wires `main.ts`:

       - `npm run dev -- -- --help` should print help text, not JSON.
       - `npm run dev -- -- -h` should print the same help text.
       - Help output should exit successfully.
     - Beginner checks:

       - If TypeScript reports an unterminated string, check that every string in the array has matching quotes.
       - If `--help` still prints JSON, make sure `main.ts` checks `parsed.help` before printing the parsed object.
       - If the help text documents a flag, that flag should already be supported by `parseArgs`.
  9. Update `src/main.ts`.
     - Import `parseArgs` and `getHelpText`.
     - Call `parseArgs(process.argv.slice(2))`.
     - If `help` is true, print the help text and exit normally.
     - Otherwise print the parsed object with `console.log(JSON.stringify(parsed, null, 2));`.
     - Wrap parsing in `try/catch`; on parse errors, print the error message and set `process.exitCode = 1`.
  10. Run manual checks.
      - `npm run check`
      - `npm run dev -- --help`
      - `npm run dev -- -p "hello"`
      - `npm run dev -- --prompt "hello" --model demo-model --provider demo --cwd .`
      - `npm run dev -- write a short greeting`
      - `npm run dev -- --bad`
- Beginner notes:
  - `process.argv` is the raw argument list from Node.
  - `process.argv.slice(2)` removes the Node executable path and script path, leaving only user input.
  - npm requires `--` before passing arguments to your script. Example: `npm run dev -- --help`.
  - A parser should turn messy terminal strings into a clean object the rest of the program can use.
- Acceptance criteria:
  - `npm run check` succeeds.
  - `npm run dev -- --help` prints usage text and exits with code 0.
  - `npm run dev -- -p "hello"` prints JSON with `"prompt": "hello"`.
  - `npm run dev -- --prompt "hello" --model demo-model --provider demo --cwd .` prints all provided values.
  - `npm run dev -- write a short greeting` prints JSON with `"prompt": "write a short greeting"`.
  - `npm run dev -- --bad` prints a clear unknown option error and exits with non-zero status.
  - Missing flag values produce clear errors.
  - No config loading, LLM calls, tools, sessions, or tests are added in this TODO.
- Reviewer checklist:
  - Confirm parser logic is isolated in `src/cli/args.ts`.
  - Confirm `main.ts` only wires parser output for now.
  - Confirm there is no `any`.
  - Confirm the implementation does not use dynamic imports.
  - Confirm the parser is deterministic and easy to test in TODO-014.

### TODO-003: Add Configuration Loading

- Status: pending
- Goal: Add a small configuration layer so later TODOs can get provider settings without reading environment variables or JSON files directly.
- Scope:
  - Create `src/config/config.ts`.
  - Create `src/utils/json.ts`.
  - Load config from environment variables.
  - Load config from an optional local JSON config file.
  - Merge config values with clear precedence.
  - Provide a default working directory.
  - Do not call an LLM, create provider objects, run tools, persist sessions, or add tests yet.
- Likely files or areas: `src/config/config.ts`, `src/utils/json.ts`
- Dependencies: TODO-001, TODO-002
- Configuration source design:
  - Local config file name: `chatrealm.config.json`.
  - Default lookup location: current working directory.
  - Optional config path override: `CHATREALM_CONFIG`.
  - Environment variables:
    - `CHATREALM_API_KEY`
    - `CHATREALM_BASE_URL`
    - `CHATREALM_MODEL`
    - `CHATREALM_CWD`
  - JSON config keys:
    - `apiKey`
    - `baseUrl`
    - `model`
    - `cwd`
  - Precedence:
    - Environment variables should override config file values.
    - Config file values should override built-in defaults.
    - `cwd` should default to `process.cwd()` when not provided.
    - API key, base URL, and model can stay `undefined` for now; TODO-005 or TODO-011 can decide when they are required.
- Step-by-step implementation guide:
  1. Create the folders.
     - Create `src/config/`.
     - Create `src/utils/`.
     - Create `src/config/config.ts`.
     - Create `src/utils/json.ts`.
  2. Define the config type in `src/config/config.ts`.
     - Export an interface named `AppConfig`.
     - Use explicit `string | undefined` for optional provider settings.
     - Keep `cwd` as a required `string` because the program should always have a working directory.
     - Recommended shape:
       ```ts
       export interface AppConfig {
         apiKey: string | undefined;
         baseUrl: string | undefined;
         model: string | undefined;
         cwd: string;
       }
       ```
     - Why `cwd` is not optional:
       - The agent will need a working directory for file tools later.
       - If the user does not provide one, `process.cwd()` is a reasonable default.
  3. Define a small load-options type.
     - Export an interface named `LoadConfigOptions`.
     - This makes the loader easy to verify manually and easier to test later.
     - Avoid `NodeJS.ProcessEnv` for now so you do not need extra Node type details in this learning step.
     - Recommended shape:
       ```ts
       export interface LoadConfigOptions {
         env?: Record<string, string | undefined>;
         cwd?: string;
       }
       ```
     - `env` lets tests or manual checks pass fake environment values later.
     - `cwd` lets callers choose where to look for `chatrealm.config.json`.
  4. Add a JSON object parser in `src/utils/json.ts`.
     - Export a function named `parseJsonObject`.
     - It should accept `text: string` and `sourceName: string`.
     - It should return `Record<string, unknown>`.
     - It should throw a clear error if JSON parsing fails or if the parsed value is not an object.
     - Start with this function skeleton:

       ```ts
       export function parseJsonObject(
         text: string,
         sourceName: string,
       ): Record<string, unknown> {
         // Implementation goes here.
       }
       ```
     - Parse the JSON inside a `try/catch`.
     - Store the parsed value in a variable typed as `unknown`.
     - Use `unknown` because the file can contain anything: an object, an array, a string, a number, `true`, `false`, or `null`.
     - Recommended parse block:

       ```ts
       let parsed: unknown;

       try {
         parsed = JSON.parse(text);
       } catch {
         throw new Error(`Invalid JSON in ${sourceName}`);
       }
       ```
     - After parsing, verify that the value is a plain JSON object.
     - The check needs three parts:

       - `typeof parsed === "object"` confirms the value is object-like.
       - `parsed !== null` excludes `null`, because JavaScript reports `typeof null` as `"object"`.
       - `!Array.isArray(parsed)` excludes arrays, because arrays are objects in JavaScript but are not valid config objects for this TODO.
     - Recommended object check:

       ```ts
       if (
         typeof parsed !== "object" ||
         parsed === null ||
         Array.isArray(parsed)
       ) {
         throw new Error(`Expected JSON object in ${sourceName}`);
       }

       return parsed as Record<string, unknown>;
       ```
     - Why the final type assertion is acceptable here:

       - The runtime checks already proved the value is a non-null object and not an array.
       - TypeScript still cannot know that every key maps to `unknown`.
       - `Record<string, unknown>` is a safe shape because values are still not trusted yet.
       - Step 5 will validate each individual value before using it as a string.
     - Full recommended implementation:

       ```ts
       export function parseJsonObject(
         text: string,
         sourceName: string,
       ): Record<string, unknown> {
         let parsed: unknown;

         try {
           parsed = JSON.parse(text);
         } catch {
           throw new Error(`Invalid JSON in ${sourceName}`);
         }

         if (
           typeof parsed !== "object" ||
           parsed === null ||
           Array.isArray(parsed)
         ) {
           throw new Error(`Expected JSON object in ${sourceName}`);
         }

         return parsed as Record<string, unknown>;
       }
       ```
     - Manual examples to reason through:

       - `parseJsonObject("{\"model\":\"demo\"}", "chatrealm.config.json")` should succeed.
       - `parseJsonObject("{", "chatrealm.config.json")` should throw `Invalid JSON in chatrealm.config.json`.
       - `parseJsonObject("null", "chatrealm.config.json")` should throw `Expected JSON object in chatrealm.config.json`.
       - `parseJsonObject("[]", "chatrealm.config.json")` should throw `Expected JSON object in chatrealm.config.json`.
       - `parseJsonObject("\"hello\"", "chatrealm.config.json")` should throw `Expected JSON object in chatrealm.config.json`.
     - What not to do:

       - Do not return the raw result of `JSON.parse`.
       - Do not use `any`.
       - Do not silently return `{}` when JSON is invalid.
       - Do not validate `apiKey`, `baseUrl`, `model`, or `cwd` in this function; Step 5 owns value-level validation.
  5. Add a helper to read optional string keys.
     - In `src/utils/json.ts`, export a function named `readOptionalString`.
     - Suggested signature:

       ```ts
       export function readOptionalString(
         object: Record<string, unknown>,
         key: string,
         sourceName: string,
       ): string | undefined
       ```
     - If the key is missing, return `undefined`.
     - If the value is a string, return it.
     - If the value exists but is not a string, throw a clear error such as `Expected string for model in chatrealm.config.json`.
     - Do not use `any`.
     - Why this helper exists:

       - `parseJsonObject` only proves that the whole JSON file is an object.
       - It does not prove that `object.model`, `object.apiKey`, or any other field is a string.
       - JSON files are external input, so TypeScript cannot trust their contents.
       - This helper creates one small, reusable place for checking optional string fields.
     - What "optional string" means here:

       - The key may be absent. Example: `{ "model": "demo" }` does not contain `apiKey`.
       - If the key is absent, the loader should treat that value as not configured and return `undefined`.
       - If the key is present, the value must be a string.
       - `undefined` means "not provided"; it is not an error for optional config keys.
     - Add the function below `parseJsonObject` in `src/utils/json.ts`.
     - Recommended implementation:

       ```ts
       export function readOptionalString(
         object: Record<string, unknown>,
         key: string,
         sourceName: string,
       ): string | undefined {
         const value = object[key];

         if (value === undefined) {
           return undefined;
         }

         if (typeof value !== "string") {
           throw new Error(`Expected string for ${key} in ${sourceName}`);
         }

         return value;
       }
       ```
     - Read the code from top to bottom:

       - `const value = object[key];` reads one property from the JSON object.
       - `object[key]` is bracket notation. It is used because `key` is a variable.
       - If `key` is `"model"`, then `object[key]` means the same thing as `object.model`.
       - `value === undefined` means the JSON object does not have that key, or the key value is actually `undefined`.
       - JSON files cannot naturally contain `undefined`, so for this TODO you can treat this as "missing".
       - `typeof value !== "string"` catches invalid values such as numbers, booleans, arrays, objects, and `null`.
       - After that check passes, TypeScript understands that `value` is a `string`.
       - Returning `value` at the end is safe because the function has already rejected non-string values.
     - Why the function takes `sourceName`:

       - Error messages should tell the user where the bad value came from.
       - `Expected string for model in chatrealm.config.json` is easier to fix than `Invalid config`.
       - Later, if config can come from another file, the same helper can still produce useful errors.
     - Why this function returns `string | undefined`:

       - `string` means the config file provided a valid value.
       - `undefined` means the config file did not provide that key.
       - It should not return an empty string as a default, because an empty string can hide mistakes.
     - Manual examples to reason through:

       - `readOptionalString({ model: "demo" }, "model", "chatrealm.config.json")` should return `"demo"`.
       - `readOptionalString({}, "model", "chatrealm.config.json")` should return `undefined`.
       - `readOptionalString({ model: 123 }, "model", "chatrealm.config.json")` should throw `Expected string for model in chatrealm.config.json`.
       - `readOptionalString({ model: null }, "model", "chatrealm.config.json")` should throw `Expected string for model in chatrealm.config.json`.
       - `readOptionalString({ model: ["demo"] }, "model", "chatrealm.config.json")` should throw `Expected string for model in chatrealm.config.json`.
     - Beginner checks:

       - If TypeScript says `object` has an implicit `any` type, make sure the parameter is exactly `object: Record<string, unknown>`.
       - If TypeScript says `key` has an implicit `any` type, make sure the parameter is exactly `key: string`.
       - If TypeScript says the function is missing a return value, make sure every branch returns or throws.
       - If the error message prints the wrong field name, make sure the template string uses `${key}`.
       - Template strings use backticks, not quotes: `` `Expected string for ${key} in ${sourceName}` ``.
     - What not to do:

       - Do not write `return object[key] as string`; that skips runtime validation.
       - Do not use `String(value)`; it would silently turn `123` into `"123"` and hide bad config.
       - Do not return `""` for missing values; use `undefined`.
       - Do not validate whether the string is a real API key, URL, model name, or path in this helper.
       - Do not read files in this helper; file reading belongs to `loadConfig`.
  6. Implement config file loading in `src/config/config.ts`.
     - Import Node built-ins at the top:

       ```ts
       import { existsSync, readFileSync } from "node:fs";
       import { resolve } from "node:path";
       ```
     - Import the JSON helpers from `../utils/json.js`.
     - Inside `loadConfig`, determine:

       - `env`: default to `process.env`.
       - `cwd`: default to `process.cwd()`.
       - `configPath`: `env.CHATREALM_CONFIG` if present, otherwise `resolve(cwd, "chatrealm.config.json")`.
     - If the config file exists, read it as UTF-8 and parse it.
     - If it does not exist, continue with an empty object.
     - Do not create the config file in this TODO.
     - Why this step exists:

       - Later code should call one function, `loadConfig`, instead of knowing where config files live.
       - This keeps file-system details inside `src/config/config.ts`.
       - It also keeps environment-variable reading out of provider, agent, and tool code.
     - Add the imports at the very top of `src/config/config.ts`.
     - The import from `../utils/json.js` should include the helpers from Steps 4 and 5:

       ```ts
       import { parseJsonObject, readOptionalString } from "../utils/json.js";
       ```
     - Why the import path ends in `.js`:

       - The TypeScript project uses Node ESM settings.
       - In Node ESM-style TypeScript, local relative imports should use the runtime `.js` extension.
       - The source file is still `json.ts`; TypeScript understands that `../utils/json.js` points to it during development.
     - Add the `loadConfig` function below the interfaces in `src/config/config.ts`.
     - Recommended starting skeleton:

       ```ts
       export function loadConfig(options: LoadConfigOptions = {}): AppConfig {
         const env = options.env ?? process.env;
         const cwd = options.cwd ?? process.cwd();
         const configPath = env.CHATREALM_CONFIG ?? resolve(cwd, "chatrealm.config.json");

         let fileConfig: Record<string, unknown> = {};

         if (existsSync(configPath)) {
           const text = readFileSync(configPath, "utf8");
           fileConfig = parseJsonObject(text, configPath);
         }

         const fileApiKey = readOptionalString(fileConfig, "apiKey", configPath);
         const fileBaseUrl = readOptionalString(fileConfig, "baseUrl", configPath);
         const fileModel = readOptionalString(fileConfig, "model", configPath);
         const fileCwd = readOptionalString(fileConfig, "cwd", configPath);

         // Step 7 will merge file values with environment variables.
       }
       ```
     - This skeleton will not pass TypeScript yet because it does not return `AppConfig`.

       - That is expected only while you are in the middle of Step 6.
       - Step 7 adds the final `const config: AppConfig = ...` and `return config`.
       - If you want `npm run check` to pass immediately after Step 6, temporarily finish the function with the Step 7 return shape instead of stopping at the comment.
     - Read the first three constants carefully:

       - `options.env ?? process.env` means: use the fake/test environment if the caller provided one; otherwise use real process environment variables.
       - `options.cwd ?? process.cwd()` means: use the caller's working directory if provided; otherwise use the directory where the command was started.
       - `env.CHATREALM_CONFIG ?? resolve(cwd, "chatrealm.config.json")` means: use the explicit config path if provided; otherwise look for `chatrealm.config.json` inside `cwd`.
     - What `resolve(cwd, "chatrealm.config.json")` does:

       - It combines the working directory with the config file name.
       - If `cwd` is `/project/ChatRealm`, the result is `/project/ChatRealm/chatrealm.config.json`.
       - On Windows, the result will use a Windows-style absolute path.
       - Using `resolve` is safer than manually joining strings with `/`.
     - Why `fileConfig` starts as `{}`:

       - The config file is optional.
       - If the file is missing, the loader still needs an object to read from.
       - Reading optional keys from `{}` simply returns `undefined`.
     - What `existsSync(configPath)` does:

       - It checks whether a file or path currently exists.
       - If it returns `true`, this TODO reads the file.
       - If it returns `false`, this TODO skips reading and keeps `fileConfig` as `{}`.
     - What `readFileSync(configPath, "utf8")` does:

       - It reads the whole file as text.
       - `"utf8"` tells Node to decode the file as normal text instead of returning raw bytes.
       - Synchronous reading is acceptable here because config loading happens once at CLI startup.
     - What `parseJsonObject(text, configPath)` does:

       - It parses the text as JSON.
       - It rejects invalid JSON.
       - It rejects valid JSON that is not an object, such as `null`, `[]`, or `"hello"`.
       - Passing `configPath` makes error messages point at the actual file path.
     - Why this step reads file values before merging:

       - `fileApiKey`, `fileBaseUrl`, `fileModel`, and `fileCwd` are only values from the JSON file.
       - They do not include environment variable overrides yet.
       - Keeping file values separate makes Step 7's precedence rule easier to see.
     - Manual examples to reason through:

       - If no config file exists, `fileConfig` should stay `{}`.
       - If `chatrealm.config.json` contains `{ "model": "demo-model" }`, then `fileModel` should be `"demo-model"`.
       - If it contains `{ "model": 123 }`, `readOptionalString` should throw a clear error.
       - If `CHATREALM_CONFIG` is set, the loader should check that path instead of the default file in `cwd`.
     - Beginner checks:

       - If TypeScript cannot find `node:fs` or `process`, you may need Node types installed later, but do not change this TODO's architecture to avoid Node APIs.
       - If TypeScript complains that `loadConfig` does not return a value, finish Step 7 before running the final check.
       - If TypeScript cannot find `../utils/json.js`, confirm `src/utils/json.ts` exists and the relative path from `src/config/config.ts` is correct.
       - If the config file is ignored even though it exists, print or inspect `configPath` temporarily to confirm which directory `cwd` points to.
     - What not to do:

       - Do not create `chatrealm.config.json` automatically.
       - Do not catch and hide JSON parse errors.
       - Do not put default model or API key values in this step.
       - Do not merge environment variables in the file-reading block; Step 7 owns precedence.
       - Do not call an LLM or create a provider from `loadConfig`.
  7. Merge file values and environment values.
     - Read file values from JSON keys: `apiKey`, `baseUrl`, `model`, `cwd`.
     - Read environment values from `CHATREALM_API_KEY`, `CHATREALM_BASE_URL`, `CHATREALM_MODEL`, `CHATREALM_CWD`.
     - Environment values win over file values.
     - `cwd` should fall back to the loader's current working directory.
     - Recommended merge shape:
       ```ts
       const config: AppConfig = {
         apiKey: env.CHATREALM_API_KEY ?? fileApiKey,
         baseUrl: env.CHATREALM_BASE_URL ?? fileBaseUrl,
         model: env.CHATREALM_MODEL ?? fileModel,
         cwd: env.CHATREALM_CWD ?? fileCwd ?? cwd,
       };
       ```
     - Return this config object.
  8. Temporarily wire `main.ts` for manual verification.
     - Import `loadConfig`.
     - After parsing CLI args and handling help, call `loadConfig()`.
     - Print both parsed args and config for now.
     - Keep this simple; TODO-011 will decide how CLI overrides combine with config.
     - Example temporary output shape:
       ```ts
       console.log(JSON.stringify({ args: parsed, config }, null, 2));
       ```
  9. Run manual checks.
     - `npm run check`
     - `npm run dev -- --help`
     - `npm run dev -- -p "hello"`
     - Create a local `chatrealm.config.json` with:
       ```json
       {
         "baseUrl": "https://example.test/v1",
         "model": "demo-model",
         "cwd": "."
       }
       ```
     - Run `npm run dev -- -p "hello"` and confirm the printed config includes those values.
     - In PowerShell, test an environment override:
       ```powershell
       $env:CHATREALM_MODEL = "env-model"
       npm run dev -- -p "hello"
       Remove-Item Env:\CHATREALM_MODEL
       ```
     - Confirm `model` becomes `"env-model"` while the env var is set.
     - Run with invalid JSON and confirm the error is clear.
  10. Clean up manual verification files.
      - Remove the temporary `chatrealm.config.json` if it was only created for manual testing.
      - Do not commit local secrets.
- Beginner notes:
  - Environment variables are strings provided by the shell or operating system.
  - A config file is useful for values you do not want to type every time.
  - Do not hardcode real API keys in source files or committed config files.
  - `process.cwd()` means the directory where the command was started.
  - `resolve(cwd, "chatrealm.config.json")` creates an absolute path to the expected config file.
  - `??` means "use the value on the left unless it is `null` or `undefined`".
- Acceptance criteria:
  - `npm run check` succeeds.
  - Missing `chatrealm.config.json` does not crash.
  - A valid `chatrealm.config.json` is loaded.
  - Environment variables override config file values.
  - `cwd` always has a string value.
  - Invalid JSON produces a clear error.
  - Non-string config values for string fields produce clear errors.
  - No LLM calls, tool execution, sessions, or tests are added in this TODO.
- Reviewer checklist:
  - Confirm config loading is isolated in `src/config/config.ts`.
  - Confirm JSON parsing helpers are isolated in `src/utils/json.ts`.
  - Confirm there is no `any`.
  - Confirm no secrets are committed.
  - Confirm `main.ts` only prints config temporarily for verification and does not start agent behavior.

### TODO-004: Define AI Transport Types

- Status: pending
- Goal: Create the provider-neutral TypeScript types that the future OpenAI-compatible provider, agent loop, and tools will share.
- Scope:
  - Create `src/ai/`.
  - Create `src/ai/types.ts`.
  - Define message types for user, assistant, and tool-result messages.
  - Define assistant content types for plain text and tool calls.
  - Define tool definition metadata that providers can send to the model.
  - Define provider request and response types.
  - Define usage and stop-reason types.
  - Define a minimal transport interface that TODO-005 can implement.
  - Define streaming-ready event types, but do not implement streaming yet.
  - Do not call any provider, execute tools, build an agent loop, or add tests yet.
- Likely files or areas: `src/ai/types.ts`
- Dependencies: TODO-001, TODO-003
- Reference from `pi`:
  - `pi` has a larger version of this boundary in [packages/ai/src/types.ts](../packages/ai/src/types.ts).
  - For ChatRealm, keep the same idea but much smaller.
  - The important lesson is not the exact number of types; it is the separation between provider-neutral app code and provider-specific API code.
- Step-by-step implementation guide:
  1. Create the AI folder.

     - Create `src/ai/`.
     - Create `src/ai/types.ts`.
     - This file should contain only exported TypeScript types and interfaces.
     - Do not put runtime provider code in this file.
  2. Add a small JSON value type.

     - Tool arguments and JSON schema objects need to represent unknown JSON data.
     - Do not use `any`.
     - Add these types near the top of `src/ai/types.ts`:

       ```ts
       export type JsonPrimitive = string | number | boolean | null;

       export type JsonValue =
         | JsonPrimitive
         | JsonValue[]
         | { [key: string]: JsonValue };

       export type JsonObject = { [key: string]: JsonValue };
       ```
     - Why this exists:

       - LLM tool calls usually pass arguments as JSON.
       - JSON can contain strings, numbers, booleans, null, arrays, and objects.
       - `JsonValue` models that shape without falling back to `any`.
     - Beginner note:

       - This is a recursive type. `JsonValue[]` means an array whose items are also JSON values.
       - `{ [key: string]: JsonValue }` means an object where every key is a string and every value is also a JSON value.
  3. Define basic text content.

     - Add a `TextContent` interface:

       ```ts
       export interface TextContent {
         type: "text";
         text: string;
       }
       ```
     - Why `type: "text"` exists:

       - This is a discriminated union tag.
       - Later, code can check `content.type === "text"` and TypeScript will know the object has `text`.
       - This pattern is heavily used in agent code because messages can contain different content kinds.
  4. Define tool-call content.

     - Add a `ToolCallContent` interface:

       ```ts
       export interface ToolCallContent {
         type: "toolCall";
         id: string;
         name: string;
         arguments: JsonObject;
       }
       ```
     - Field meanings:

       - `id`: provider-generated or adapter-generated ID for matching the later tool result.
       - `name`: tool name, such as `read_file` or `search`.
       - `arguments`: parsed JSON object that will be passed to the tool.
     - Why `arguments` is not `string`:

       - Provider APIs often send tool arguments as a JSON string.
       - The provider adapter in TODO-005 should parse that string.
       - The rest of ChatRealm should receive a typed object, not raw JSON text.
  5. Define assistant content as a union.

     - Add:

       ```ts
       export type AssistantContent = TextContent | ToolCallContent;
       ```
     - Meaning:

       - An assistant response can contain normal text.
       - It can also request one or more tools.
       - The agent loop in TODO-010 will inspect this union to decide whether to print a final answer or run tools.
  6. Define usage and stop reason.

     - Add:

       ```ts
       export interface Usage {
         inputTokens: number;
         outputTokens: number;
         totalTokens: number;
       }

       export type StopReason = "stop" | "length" | "toolUse" | "error";
       ```
     - What these mean:

       - `Usage` records approximate token counts returned by the provider.
       - `stop` means the assistant finished normally.
       - `length` means the model stopped because it hit a token limit.
       - `toolUse` means the model wants the agent to run a tool.
       - `error` means the adapter created an error response instead of a normal answer.
     - Keep cost tracking out of the MVP for now.
  7. Define message types.

     - Add:

       ```ts
       export interface UserMessage {
         role: "user";
         content: string;
       }

       export interface AssistantMessage {
         role: "assistant";
         content: AssistantContent[];
         model: string;
         usage: Usage | undefined;
         stopReason: StopReason;
         errorMessage: string | undefined;
       }

       export interface ToolResultMessage {
         role: "toolResult";
         toolCallId: string;
         toolName: string;
         content: string;
         isError: boolean;
       }

       export type Message = UserMessage | AssistantMessage | ToolResultMessage;
       ```
     - Why each message has a literal `role`:

       - `role` tells later code what kind of message it is.
       - TypeScript can narrow the union based on `message.role`.
       - Example: after `if (message.role === "assistant")`, TypeScript knows `message.content` is `AssistantContent[]`.
     - Why `usage` and `errorMessage` are explicit `| undefined`:

       - Some providers may not return usage.
       - Normal responses do not have an error message.
       - This matches the style used earlier in `ParsedArgs` and `AppConfig`.
  8. Define tool definition metadata.

     - Add:

       ```ts
       export interface ToolDefinition {
         name: string;
         description: string;
         parameters: JsonObject;
       }
       ```
     - What `parameters` means:

       - It is a JSON-schema-like object that describes what arguments the tool accepts.
       - Example later: a read-file tool may declare that it needs a `path` string.
       - Do not add a JSON schema library in this TODO.
     - Why this belongs in `src/ai/types.ts`:

       - The model provider needs tool metadata to send to the API.
       - The tool registry in TODO-006 can later use compatible metadata.
       - This creates the contract between AI provider code and tool code.
  9. Define provider request and response types.

     - Add:

       ```ts
       export interface ChatRequest {
         model: string;
         systemPrompt: string | undefined;
         messages: Message[];
         tools: ToolDefinition[];
       }

       export interface ChatResponse {
         message: AssistantMessage;
       }
       ```
     - Why `ChatRequest` exists:

       - The agent loop should not know OpenAI's exact HTTP request shape.
       - It should build a provider-neutral `ChatRequest`.
       - TODO-005 will translate `ChatRequest` into an OpenAI-compatible API payload.
     - Why `tools` is always an array:

       - An empty array means "no tools available".
       - This is simpler than checking both `undefined` and array cases.
  10. Define the transport interface.

      - Add:

        ```ts
        export interface ChatTransport {
          complete(request: ChatRequest): Promise<ChatResponse>;
        }
        ```
      - What a transport is:

        - It is an object that knows how to call a model provider.
        - The agent loop can call `transport.complete(request)` without knowing whether the provider is OpenAI, local, fake, or something else.
        - TODO-005 will implement this interface for one OpenAI-compatible provider.
      - Why `complete` returns a `Promise`:

        - Provider calls use network I/O.
        - Network I/O is asynchronous in JavaScript.
        - `Promise<ChatResponse>` means the function eventually resolves to a `ChatResponse`.
  11. Add streaming-ready event types.

      - The MVP will not stream yet, but defining small event types now keeps the boundary ready.
      - Add:

        ```ts
        export type ChatStreamEvent =
          | { type: "textDelta"; delta: string }
          | { type: "toolCall"; toolCall: ToolCallContent }
          | { type: "done"; response: ChatResponse }
          | { type: "error"; message: string };
        ```
      - Why this is "streaming-ready":

        - Later, a provider could emit text chunks as they arrive.
        - The rest of the program can handle events without changing the core message types.
        - For now, TODO-005 can ignore this type.
  12. Review the full expected `src/ai/types.ts`.

      - A complete first version can look like this:

        ```ts
        export type JsonPrimitive = string | number | boolean | null;

        export type JsonValue =
          | JsonPrimitive
          | JsonValue[]
          | { [key: string]: JsonValue };

        export type JsonObject = { [key: string]: JsonValue };

        export interface TextContent {
          type: "text";
          text: string;
        }

        export interface ToolCallContent {
          type: "toolCall";
          id: string;
          name: string;
          arguments: JsonObject;
        }

        export type AssistantContent = TextContent | ToolCallContent;

        export interface Usage {
          inputTokens: number;
          outputTokens: number;
          totalTokens: number;
        }

        export type StopReason = "stop" | "length" | "toolUse" | "error";

        export interface UserMessage {
          role: "user";
          content: string;
        }

        export interface AssistantMessage {
          role: "assistant";
          content: AssistantContent[];
          model: string;
          usage: Usage | undefined;
          stopReason: StopReason;
          errorMessage: string | undefined;
        }

        export interface ToolResultMessage {
          role: "toolResult";
          toolCallId: string;
          toolName: string;
          content: string;
          isError: boolean;
        }

        export type Message = UserMessage | AssistantMessage | ToolResultMessage;

        export interface ToolDefinition {
          name: string;
          description: string;
          parameters: JsonObject;
        }

        export interface ChatRequest {
          model: string;
          systemPrompt: string | undefined;
          messages: Message[];
          tools: ToolDefinition[];
        }

        export interface ChatResponse {
          message: AssistantMessage;
        }

        export interface ChatTransport {
          complete(request: ChatRequest): Promise<ChatResponse>;
        }

        export type ChatStreamEvent =
          | { type: "textDelta"; delta: string }
          | { type: "toolCall"; toolCall: ToolCallContent }
          | { type: "done"; response: ChatResponse }
          | { type: "error"; message: string };
        ```
  13. Run verification.

      - Run `npm run check`.
      - If TypeScript reports unused code, remember that exported types are allowed even if not imported yet.
      - If the checker complains about syntax, inspect the nearest union type and make sure every line has the correct `|`, `{}`, and `;`.
- Beginner notes:
  - A type file describes shapes; it does not run behavior.
  - `interface` is good for object shapes.
  - `type` is good for unions such as `"stop" | "length"`.
  - A discriminated union is a union where each member has a literal tag field such as `role` or `type`.
  - `unknown` means "we do not trust this value yet"; `JsonValue` is more specific than `unknown` because it limits values to JSON-compatible data.
  - `Promise<T>` means an async function will eventually produce `T`.
- Acceptance criteria:
  - `src/ai/types.ts` exists.
  - `npm run check` succeeds.
  - The file exports provider-neutral message, content, tool, usage, request, response, transport, and stream-event types.
  - No provider-specific HTTP payload types are added yet.
  - No runtime provider calls are added yet.
  - No `any` is used.
  - No new runtime dependency is added.
- Reviewer checklist:
  - Confirm the AI boundary does not import OpenAI-specific types.
  - Confirm tool-call arguments use `JsonObject`, not `any`.
  - Confirm assistant text and tool-call content are distinguishable by `type`.
  - Confirm messages are distinguishable by `role`.
  - Confirm TODO-005 can implement `ChatTransport` without changing these types.

### TODO-005: Implement OpenAI-Compatible Provider

- Status: completed
- Goal: Implement one real provider adapter that satisfies the `ChatTransport` interface from TODO-004 and can call an OpenAI-compatible `/chat/completions` API.
- Scope:
  - Create `src/ai/openai-compatible.ts`.
  - Use the provider-neutral types from `src/ai/types.ts`.
  - Send user, assistant, and tool-result messages to an OpenAI-compatible API.
  - Send optional tool definitions using OpenAI's `tools` format.
  - Convert the provider response back into `ChatResponse`.
  - Parse assistant text responses.
  - Parse assistant tool calls and convert tool-call arguments into `JsonObject`.
  - Add clear errors for missing API key, HTTP failures, invalid JSON, and malformed provider responses.
  - Do not build the agent loop yet.
  - Do not execute any tools yet.
  - Do not add streaming yet.
  - Do not add tests yet unless you want extra practice; TODO-014 owns formal tests.
- Likely files or areas: `src/ai/openai-compatible.ts`, `src/config/config.ts`
- Dependencies: TODO-003, TODO-004
- Reference from `pi`:
  - `pi` has a larger provider layer under [packages/ai/src/providers/](../packages/ai/src/providers/).
  - ChatRealm should not copy that full registry.
  - The MVP lesson is the boundary: app code uses `ChatTransport`; provider code knows the OpenAI-compatible wire format.
- Beginner mental model:
  - `ChatTransport` is your app's private shape.
  - OpenAI-compatible chat completions is the provider's public HTTP shape.
  - `openai-compatible.ts` is the translator between those two worlds.
  - The rest of ChatRealm should not need to know OpenAI's exact JSON field names.
- Step-by-step implementation guide:
  1. Create the provider file.
     - Create `src/ai/openai-compatible.ts`.
     - This file should contain runtime code, unlike `src/ai/types.ts`, which only contains types.
     - Add top-level imports only:

       ```ts
       import { parseJsonObject } from "../utils/json.js";
       import type {
         AssistantContent,
         AssistantMessage,
         ChatRequest,
         ChatResponse,
         ChatTransport,
         JsonObject,
         JsonValue,
         Message,
         StopReason,
         ToolCallContent,
         ToolDefinition,
         Usage,
       } from "./types.js";
       ```
     - Why `import type` is used:

       - These imports are TypeScript types only.
       - They disappear at runtime.
       - This keeps the generated JavaScript smaller and avoids accidental runtime dependencies.
     - Keep imports at the top. Do not use dynamic imports.
  2. Define provider options.
     - Add an exported interface named `OpenAICompatibleOptions`.
     - Recommended shape:

       ```ts
       export interface OpenAICompatibleOptions {
         apiKey: string;
         baseUrl?: string;
       }
       ```
     - `apiKey` is required because the provider cannot call the API without it.
     - `baseUrl` is optional because the provider can default to the official OpenAI base URL.
     - Do not put `model` here for this MVP. The model comes from `ChatRequest.model`.
  3. Add a default base URL.
     - Add this constant near the top:

       ```ts
       const DEFAULT_BASE_URL = "https://api.openai.com/v1";
       ```
     - This means a normal OpenAI user only needs to configure `apiKey`.
     - Users of compatible services can still pass a custom `baseUrl`.
  4. Define minimal raw provider response types.
     - These types describe only the fields ChatRealm needs from the HTTP response.
     - Do not model the entire OpenAI API.
     - Recommended types:

       ```ts
       interface OpenAIChatCompletionResponse {
         choices?: OpenAIChoice[];
         usage?: {
           prompt_tokens?: number;
           completion_tokens?: number;
           total_tokens?: number;
         };
       }

       interface OpenAIChoice {
         finish_reason?: string | null;
         message?: {
           content?: string | null;
           tool_calls?: OpenAIToolCall[];
         };
       }

       interface OpenAIToolCall {
         id?: string;
         type?: string;
         function?: {
           name?: string;
           arguments?: string;
         };
       }
       ```
     - Why the fields are optional:

       - External HTTP responses are not trusted.
       - Optional fields force your code to check before using them.
       - This is safer than pretending the network always returns the exact shape you want.
  5. Implement the transport class.
     - Add a class that implements `ChatTransport`.
     - Recommended skeleton:

       ```ts
       export class OpenAICompatibleTransport implements ChatTransport {
         private readonly apiKey: string;
         private readonly baseUrl: string;

         constructor(options: OpenAICompatibleOptions) {
           if (options.apiKey.trim() === "") {
             throw new Error("Missing OpenAI-compatible API key");
           }

           this.apiKey = options.apiKey;
           this.baseUrl = trimTrailingSlash(options.baseUrl ?? DEFAULT_BASE_URL);
         }

         async complete(request: ChatRequest): Promise<ChatResponse> {
           // Implementation goes here.
         }
       }
       ```
     - Why a class is useful here:

       - The API key and base URL are setup values.
       - `complete` can reuse them for every request.
       - Later you can swap this transport for a fake transport in tests.
  6. Add a small URL helper.
     - Add this function below the class or above it:

       ```ts
       function trimTrailingSlash(value: string): string {
         return value.endsWith("/") ? value.slice(0, -1) : value;
       }
       ```
     - Why this exists:

       - Users might configure `https://api.openai.com/v1/` with a trailing slash.
       - The provider will append `/chat/completions`.
       - Trimming avoids URLs like `https://api.openai.com/v1//chat/completions`.
  7. Build the HTTP request body.
     - Inside `complete`, create a plain object for the OpenAI-compatible API:

       ```ts
       const body = {
         model: request.model,
         messages: toOpenAIMessages(request),
         tools: request.tools.length > 0 ? request.tools.map(toOpenAITool) : undefined,
       };
       ```
     - The `messages` field must use OpenAI roles and content format.
     - The `tools` field should be omitted when there are no tools.
     - Do not include streaming fields in this TODO.
     - Do not include tool execution here; this file only sends definitions and receives tool-call requests.
  8. Send the HTTP request with `fetch`.
     - Node 18+ has global `fetch`, so no runtime dependency is needed for this MVP.
     - Recommended code shape:

       ```ts
       const response = await fetch(`${this.baseUrl}/chat/completions`, {
         method: "POST",
         headers: {
           "authorization": `Bearer ${this.apiKey}`,
           "content-type": "application/json",
         },
         body: JSON.stringify(body),
       });
       ```
     - Header notes:

       - `authorization` carries the API key.
       - `content-type` tells the server the body is JSON.
       - Header names are case-insensitive, so lowercase is fine.
  9. Handle HTTP errors.
     - If `response.ok` is false, read the response text and throw a clear error.
     - Recommended code shape:

       ```ts
       if (!response.ok) {
         const errorText = await response.text();
         throw new Error(
           `OpenAI-compatible request failed with ${response.status}: ${errorText}`,
         );
       }
       ```
     - This helps you see whether the problem is an invalid key, bad base URL, bad model, or provider-side error.
     - Do not swallow HTTP errors and return an assistant message; failed HTTP is not a normal assistant response.
  10. Parse the JSON response.
      - Read the response body as text first.
      - Use `parseJsonObject` so invalid JSON produces a clear error.
      - Recommended code shape:

        ```ts
        const responseText = await response.text();
        const json = parseJsonObject(responseText, "OpenAI-compatible response");
        ```
      - Then convert `json` into `OpenAIChatCompletionResponse` after validation helpers inspect it.
      - Avoid `any`; use `unknown`, `Record<string, unknown>`, and small helper functions.
      - Why this step needs more than `JSON.parse`:

        - `JSON.parse` can tell you whether the text is valid JSON.
        - It cannot tell you whether the JSON has the shape your provider expects.
        - A provider response could be valid JSON but still be unusable, for example `{ "error": "bad model" }`.
        - This step should reject malformed success responses before later code reads fields from them.
      - Do not write this:

        ```ts
        const data = await response.json() as OpenAIChatCompletionResponse;
        ```
      - Why not:

        - `response.json()` returns untrusted external data.
        - `as OpenAIChatCompletionResponse` only tells TypeScript to trust you.
        - It does not check anything at runtime.
        - If the response is malformed, your code may crash later with a confusing error.
      - Use this safer flow instead:

        1. Read response text.
        2. Parse it with `parseJsonObject`.
        3. Validate the fields your provider needs.
        4. Return a small typed object for later steps.
      - Add a helper to recognize plain objects:

        ```ts
        function isRecord(value: unknown): value is Record<string, unknown> {
          return (
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value)
          );
        }
        ```
      - Why `isRecord` exists:

        - TypeScript cannot safely read `value.choices` from `unknown`.
        - After `isRecord(value)` returns true, TypeScript knows `value` is object-like.
        - It still does not trust individual fields; you must check those separately.
      - Add a helper that validates the top-level response:

        ```ts
        function toOpenAIChatCompletionResponse(
          json: Record<string, unknown>,
        ): OpenAIChatCompletionResponse {
          const choices = json.choices;

          if (!Array.isArray(choices)) {
            throw new Error("OpenAI-compatible response is missing choices");
          }

          return {
            choices: choices.map(toOpenAIChoice),
            usage: toOpenAIUsage(json.usage),
          };
        }
        ```
      - What this helper checks:

        - `choices` must exist.
        - `choices` must be an array.
        - Each item in `choices` is passed to another helper for validation.
        - `usage` is optional, so it can be converted separately.
      - Add a helper that validates each choice:

        ```ts
        function toOpenAIChoice(value: unknown): OpenAIChoice {
          if (!isRecord(value)) {
            throw new Error("OpenAI-compatible choice must be an object");
          }

          const message = value.message;

          if (!isRecord(message)) {
            throw new Error("OpenAI-compatible choice is missing message");
          }

          return {
            finish_reason: readOptionalStringOrNull(value.finish_reason),
            message: {
              content: readOptionalStringOrNull(message.content),
              tool_calls: readOptionalToolCalls(message.tool_calls),
            },
          };
        }
        ```
      - Why choice validation is separated:

        - The top-level response only knows `choices` is an array.
        - Each array item still needs its own checks.
        - Smaller helpers make TypeScript errors easier to understand.
      - Add small value helpers:

        ```ts
        function readOptionalStringOrNull(value: unknown): string | null | undefined {
          if (value === undefined || value === null || typeof value === "string") {
            return value;
          }

          throw new Error("Expected optional string value in OpenAI-compatible response");
        }

        function readOptionalNumber(value: unknown): number | undefined {
          if (value === undefined) {
            return undefined;
          }

          if (typeof value !== "number") {
            throw new Error("Expected optional number value in OpenAI-compatible response");
          }

          return value;
        }
        ```
      - Why these helpers are intentionally generic:

        - They avoid repeating the same `typeof` checks.
        - They keep the response parser readable.
        - This MVP does not need perfect field-specific messages yet.
      - Add a usage helper:

        ```ts
        function toOpenAIUsage(value: unknown): OpenAIChatCompletionResponse["usage"] {
          if (value === undefined) {
            return undefined;
          }

          if (!isRecord(value)) {
            throw new Error("OpenAI-compatible usage must be an object");
          }

          return {
            prompt_tokens: readOptionalNumber(value.prompt_tokens),
            completion_tokens: readOptionalNumber(value.completion_tokens),
            total_tokens: readOptionalNumber(value.total_tokens),
          };
        }
        ```
      - Add a tool-call list helper:

        ```ts
        function readOptionalToolCalls(value: unknown): OpenAIToolCall[] | undefined {
          if (value === undefined) {
            return undefined;
          }

          if (!Array.isArray(value)) {
            throw new Error("OpenAI-compatible tool_calls must be an array");
          }

          return value.map(toOpenAIToolCall);
        }
        ```
      - Add a single tool-call helper:

        ```ts
        function toOpenAIToolCall(value: unknown): OpenAIToolCall {
          if (!isRecord(value)) {
            throw new Error("OpenAI-compatible tool call must be an object");
          }

          const fn = value.function;

          if (!isRecord(fn)) {
            throw new Error("OpenAI-compatible tool call is missing function");
          }

          return {
            id: readOptionalStringOrNull(value.id) ?? undefined,
            type: readOptionalStringOrNull(value.type) ?? undefined,
            function: {
              name: readOptionalStringOrNull(fn.name) ?? undefined,
              arguments: readOptionalStringOrNull(fn.arguments) ?? undefined,
            },
          };
        }
        ```
      - After these helpers exist, Step 10 inside `complete` can look like this:

        ```ts
        const responseText = await response.text();
        const json = parseJsonObject(responseText, "OpenAI-compatible response");
        const data = toOpenAIChatCompletionResponse(json);
        ```
      - Then later steps can use `data.choices` and `data.usage` without re-parsing the raw JSON.
      - Beginner checks:

        - If TypeScript says a value is `unknown`, add a runtime check before reading properties from it.
        - If TypeScript says a property does not exist on `unknown`, you probably forgot `isRecord`.
        - If TypeScript says a return type does not match, check whether you returned `null` where the interface expects `undefined`.
        - If a helper throws too early, compare the real provider JSON with the minimal raw response types in Step 4.
      - What not to do:

        - Do not use `any`.
        - Do not trust `response.json()` without validation.
        - Do not parse tool-call `arguments` in Step 10; Step 14 owns assistant content parsing.
        - Do not convert to `ChatResponse` in Step 10; Step 13 owns that conversion.
        - Do not catch malformed response errors here unless you rethrow a clear error.
  11. Convert ChatRealm messages to OpenAI messages.
      - Add a helper named `toOpenAIMessages`.
      - It should:

        - Add a system message first if `request.systemPrompt` is defined.
        - Convert user messages to `{ role: "user", content: message.content }`.
        - Convert assistant text and tool-call content to one assistant message.
        - Convert tool-result messages to `{ role: "tool", tool_call_id, content }`.
      - Beginner-friendly first version:

        ```ts
        function toOpenAIMessages(request: ChatRequest): JsonObject[] {
          const messages: JsonObject[] = [];

          if (request.systemPrompt !== undefined) {
            messages.push({
              role: "system",
              content: request.systemPrompt,
            });
          }

          for (const message of request.messages) {
            messages.push(toOpenAIMessage(message));
          }

          return messages;
        }
        ```
      - Then add `toOpenAIMessage(message: Message): JsonObject`.
      - Keep this helper small and use `switch (message.role)`.
      - Do not support image messages or streaming chunks in this TODO.
  12. Convert tools to OpenAI tool definitions.
      - Add a helper named `toOpenAITool`.
      - Recommended shape:

        ```ts
        function toOpenAITool(tool: ToolDefinition): JsonObject {
          return {
            type: "function",
            function: {
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters,
            },
          };
        }
        ```
      - This translates ChatRealm's provider-neutral `ToolDefinition` into OpenAI's function-tool format.
      - The provider does not execute the tool. It only tells the model which tools exist.
  13. Convert the provider response to `ChatResponse`.
      - The happy path is:

        - Get the first choice.
        - Read `choice.message.content`.
        - Read `choice.message.tool_calls`.
        - Convert them into `AssistantContent[]`.
        - Convert usage.
        - Convert finish reason.
        - Return `{ message }`.
      - Recommended final shape:

        ```ts
        const message: AssistantMessage = {
          role: "assistant",
          content,
          model: request.model,
          usage,
          stopReason,
          errorMessage: undefined,
        };

        return { message };
        ```
      - If the response has no choices or no message, throw a clear error.
  14. Parse assistant content.
      - If `content` is a non-empty string, add:

        ```ts
        { type: "text", text: content }
        ```
      - If `tool_calls` exist, convert each function tool call to:

        ```ts
        {
          type: "toolCall",
          id: toolCall.id,
          name: toolCall.function.name,
          arguments: parsedArguments,
        }
        ```
      - `toolCall.function.arguments` is a JSON string, not an object.
      - Use `parseJsonObject(argumentsText, "tool call arguments")` to parse it.
      - Treat missing `id`, missing `name`, or invalid arguments as malformed provider response errors.
  15. Convert finish reasons.
      - Add a helper named `toStopReason`.
      - Recommended mapping:

        ```ts
        function toStopReason(finishReason: string | null | undefined): StopReason {
          if (finishReason === "tool_calls") {
            return "toolUse";
          }

          if (finishReason === "length") {
            return "length";
          }

          if (finishReason === "stop" || finishReason === null || finishReason === undefined) {
            return "stop";
          }

          return "error";
        }
        ```
      - OpenAI uses `"tool_calls"`; ChatRealm uses `"toolUse"`.
      - This helper keeps provider-specific naming out of the rest of the app.
  16. Convert usage.
      - Add a helper named `toUsage`.
      - If usage is missing, return `undefined`.
      - Otherwise map:
        - `prompt_tokens` to `inputTokens`
        - `completion_tokens` to `outputTokens`
        - `total_tokens` to `totalTokens`
      - If a number is missing, use `0` for this MVP.
  17. Add a small factory function.
      - Add this at the bottom:

        ```ts
        export function createOpenAICompatibleTransport(
          options: OpenAICompatibleOptions,
        ): ChatTransport {
          return new OpenAICompatibleTransport(options);
        }
        ```
      - This makes TODO-011 wiring easier.
      - The rest of the app can call a function instead of directly using `new`.
  18. Run type checking.
      - From `ChatRealm/`, run:

        ```powershell
        npm run check
        ```
      - Fix all TypeScript errors before moving on.
      - Common fixes:

        - If `fetch` is unknown, make sure your TypeScript `lib` includes a modern environment or install/update Node types.
        - If `JsonObject` rejects a value, check that nested values are JSON-compatible.
        - If TypeScript asks for return values, make sure every helper returns or throws.
  19. Optional manual smoke test.
      - This TODO does not need full CLI wiring.
      - If you want to manually test the provider, create a temporary script outside committed source or wait until TODO-011.
      - Do not commit API keys or local smoke-test files.
- Beginner notes:
  - `fetch` sends the HTTP request.
  - `await` pauses until the network response arrives.
  - `JSON.stringify(body)` turns a JavaScript object into JSON text for the HTTP request.
  - `response.ok` is true for successful 2xx HTTP statuses.
  - Provider responses are external data, so validate before trusting fields.
  - Tool calls are requests from the model; they are not tool results.
  - Tool execution happens later in the agent loop.
- Acceptance criteria:
  - `src/ai/openai-compatible.ts` exists.
  - It exports `OpenAICompatibleTransport` or a factory that returns `ChatTransport`.
  - It sends requests to `${baseUrl}/chat/completions`.
  - It includes the authorization bearer token.
  - It converts ChatRealm messages into OpenAI-compatible messages.
  - It converts ChatRealm tool definitions into OpenAI-compatible function tools.
  - It returns `ChatResponse` with an `AssistantMessage`.
  - It supports plain text assistant responses.
  - It supports assistant tool calls with parsed JSON arguments.
  - It maps usage into `Usage | undefined`.
  - It maps provider finish reasons into `StopReason`.
  - HTTP failures and malformed responses produce clear errors.
  - `npm run check` succeeds.
  - No agent loop, tool execution, session persistence, or streaming is implemented in this TODO.
- Reviewer checklist:
  - Confirm provider-specific JSON shapes are isolated in `src/ai/openai-compatible.ts`.
  - Confirm `src/ai/types.ts` stays provider-neutral.
  - Confirm there is no `any`.
  - Confirm no dynamic imports are used.
  - Confirm API keys are read from config or options, not hardcoded.
  - Confirm tool calls are only parsed and returned, not executed.

### TODO-006: Define Tool Contracts And Registry

- Status: pending
- Goal: Create the provider-neutral tool boundary that later TODOs can plug real tools into.
- Scope:
  - Create `src/tools/`.
  - Create `src/tools/types.ts`.
  - Create `src/tools/registry.ts`.
  - Define the runtime shape of a tool implementation.
  - Reuse `ToolDefinition` and `JsonObject` from `src/ai/types.ts`.
  - Add a registry that can register tools, list model-visible tool definitions, and look up tools by name.
  - Add clear errors for invalid tool names and duplicate tool registration.
  - Do not implement read-file, search, write-file, or shell tools yet.
  - Do not execute model-requested tool calls yet.
  - Do not build the agent loop yet.
- Likely files or areas: `src/tools/types.ts`, `src/tools/registry.ts`
- Dependencies: TODO-004
- Reference from `pi`:
  - `pi` has a larger tool system under [packages/coding-agent/src/core/tools/](../packages/coding-agent/src/core/tools/).
  - ChatRealm should not copy the full implementation.
  - The MVP lesson is the boundary: the model sees `ToolDefinition`; the agent runs an internal `AgentTool`.
- Beginner mental model:
  - A tool has two sides.
  - The model-visible side is metadata: name, description, and JSON schema parameters.
  - The runtime side is code: an `execute` function that receives parsed JSON arguments.
  - A registry is just a lookup table from tool name to tool implementation.
  - TODO-006 only builds the table and contracts. TODO-007 and TODO-008 will add real tools.
- Step-by-step implementation guide:
  1. Create the tools folder.

     - Create `src/tools/`.
     - Create `src/tools/types.ts`.
     - Create `src/tools/registry.ts`.
     - Keep concrete tool implementations out of this TODO.
  2. Import shared AI types in `src/tools/types.ts`.

     - Add top-level type imports:

       ```ts
       import type {
         JsonObject,
         ToolDefinition,
       } from "../ai/types.js";
       ```
     - Why these come from `src/ai/types.ts`:

       - `ToolDefinition` is what the provider sends to the model.
       - `JsonObject` is the safe shape for parsed tool arguments.
       - Reusing them keeps the AI boundary and tool boundary connected without duplicating types.
  3. Define the tool execution context.

     - Export an interface named `ToolContext`.
     - Recommended first shape:

       ```ts
       export interface ToolContext {
         cwd: string;
       }
       ```
     - `cwd` is the working directory tools should operate inside.
     - Do not add session state, config, logging, approvals, or UI here yet.
     - Later TODOs can extend this context when real needs appear.
  4. Define the tool result type.

     - Export an interface named `ToolResult`.
     - Recommended shape:

       ```ts
       export interface ToolResult {
         content: string;
         isError: boolean;
       }
       ```
     - Meaning:

       - `content` is the text that will later be sent back to the model.
       - `isError` tells the agent loop whether the tool succeeded or failed.
     - Keep this result text-only for the MVP.
     - Do not add binary output, images, streaming events, or rich rendering yet.
  5. Define the internal tool interface.

     - Export an interface named `AgentTool`.
     - Recommended shape:

       ```ts
       export interface AgentTool {
         definition: ToolDefinition;
         execute(args: JsonObject, context: ToolContext): Promise<ToolResult>;
       }
       ```
     - Why this shape works:

       - `definition` is sent to the model in `ChatRequest.tools`.
       - `execute` is called later by the agent loop when the model requests a tool.
       - `args` is already a JSON object because TODO-005 parses tool-call arguments.
       - `context` gives the tool the current working directory without using globals.
  6. Add the registry imports in `src/tools/registry.ts`.

     - Add:

       ```ts
       import type { ToolDefinition } from "../ai/types.js";
       import type { AgentTool } from "./types.js";
       ```
     - Keep these as type imports.
     - `registry.ts` should not import provider code or agent-loop code.
  7. Implement a `ToolRegistry` class.

     - Export a class named `ToolRegistry`.
     - Store tools in a private `Map<string, AgentTool>`.
     - Recommended skeleton:

       ```ts
       export class ToolRegistry {
         private readonly tools = new Map<string, AgentTool>();

         constructor(tools: AgentTool[] = []) {
           for (const tool of tools) {
             this.register(tool);
           }
         }
       }
       ```
     - Why a class is useful here:

       - The registry has internal state.
       - It can enforce duplicate-name rules in one place.
       - Later TODOs can pass the registry into the agent loop.
  8. Add `register`.

     - Add a method that validates the tool name and stores the tool.
     - Recommended shape:

       ```ts
       register(tool: AgentTool): void {
         const name = tool.definition.name;

         if (name.trim() === "") {
           throw new Error("Tool name cannot be empty");
         }

         if (this.tools.has(name)) {
           throw new Error(`Duplicate tool registered: ${name}`);
         }

         this.tools.set(name, tool);
       }
       ```
     - Why this validation belongs in the registry:

       - A duplicate name makes later lookup ambiguous.
       - An empty name cannot be called by the model.
       - Concrete tools should not each reimplement registry rules.
  9. Add lookup methods.

     - Add `get(name: string): AgentTool | undefined`.
     - Add `require(name: string): AgentTool`.
     - Recommended shape:

       ```ts
       get(name: string): AgentTool | undefined {
         return this.tools.get(name);
       }

       require(name: string): AgentTool {
         const tool = this.get(name);

         if (tool === undefined) {
           throw new Error(`Unknown tool: ${name}`);
         }

         return tool;
       }
       ```
     - Why both methods exist:

       - `get` is useful when absence is allowed.
       - `require` is useful when absence is an error.
       - TODO-010 can use `require` when executing a tool call requested by the model.
  10. Add list methods.

      - Add `list(): AgentTool[]`.
      - Add `definitions(): ToolDefinition[]`.
      - Recommended shape:

        ```ts
        list(): AgentTool[] {
          return [...this.tools.values()];
        }

        definitions(): ToolDefinition[] {
          return this.list().map((tool) => tool.definition);
        }
        ```
      - `definitions()` is the bridge to `ChatRequest.tools`.
      - The provider should receive definitions, not full executable tool objects.
      - Returning new arrays prevents callers from mutating the registry's internal `Map`.
  11. Add a small factory function.

      - Export a function named `createToolRegistry`.
      - Recommended shape:

        ```ts
        export function createToolRegistry(tools: AgentTool[] = []): ToolRegistry {
          return new ToolRegistry(tools);
        }
        ```
      - This keeps future wiring simple.
      - TODO-011 can create a registry without directly using `new` if you prefer factory functions.
  12. Review the full expected `src/tools/types.ts`.

      - A complete first version can look like this:

        ```ts
        import type {
          JsonObject,
          ToolDefinition,
        } from "../ai/types.js";

        export interface ToolContext {
          cwd: string;
        }

        export interface ToolResult {
          content: string;
          isError: boolean;
        }

        export interface AgentTool {
          definition: ToolDefinition;
          execute(args: JsonObject, context: ToolContext): Promise<ToolResult>;
        }
        ```
  13. Review the full expected `src/tools/registry.ts`.

      - A complete first version can look like this:

        ```ts
        import type { ToolDefinition } from "../ai/types.js";
        import type { AgentTool } from "./types.js";

        export class ToolRegistry {
          private readonly tools = new Map<string, AgentTool>();

          constructor(tools: AgentTool[] = []) {
            for (const tool of tools) {
              this.register(tool);
            }
          }

          register(tool: AgentTool): void {
            const name = tool.definition.name;

            if (name.trim() === "") {
              throw new Error("Tool name cannot be empty");
            }

            if (this.tools.has(name)) {
              throw new Error(`Duplicate tool registered: ${name}`);
            }

            this.tools.set(name, tool);
          }

          get(name: string): AgentTool | undefined {
            return this.tools.get(name);
          }

          require(name: string): AgentTool {
            const tool = this.get(name);

            if (tool === undefined) {
              throw new Error(`Unknown tool: ${name}`);
            }

            return tool;
          }

          list(): AgentTool[] {
            return [...this.tools.values()];
          }

          definitions(): ToolDefinition[] {
            return this.list().map((tool) => tool.definition);
          }
        }

        export function createToolRegistry(tools: AgentTool[] = []): ToolRegistry {
          return new ToolRegistry(tools);
        }
        ```
  14. Optional manual check with a fake tool.

      - You do not need a test framework for this TODO.
      - If you want extra confidence, create a temporary local scratch file and delete it after checking.
      - The fake tool should:
        - Have a `definition.name`.
        - Return `{ content: "ok", isError: false }`.
        - Be registered in a `ToolRegistry`.
        - Show up in `definitions()`.
      - Do not commit scratch files.
  15. Run type checking.

      - From `ChatRealm/`, run:

        ```powershell
        npm run check
        ```
      - Fix all TypeScript errors before moving on.
      - Common fixes:

        - If TypeScript cannot find `../ai/types.js`, check the relative path from `src/tools/`.
        - If an import is only used as a type, use `import type`.
        - If `execute` returns a plain `ToolResult`, wrap it in `async` or return `Promise.resolve(...)`.
        - If `JsonObject` rejects a schema, make sure every schema value is JSON-compatible.
- Beginner notes:
  - `ToolDefinition` is for the model.
  - `AgentTool` is for your program.
  - `ToolRegistry` connects a tool name to an `AgentTool`.
  - JSON schema metadata describes expected arguments; it does not execute or validate by itself in this MVP.
  - The actual field validation for read/search/write/shell arguments belongs in the concrete tools later.
  - Keep tool execution out of the provider. The provider only returns tool-call requests.
- Acceptance criteria:
  - `src/tools/types.ts` exists.
  - `src/tools/registry.ts` exists.
  - `ToolContext`, `ToolResult`, and `AgentTool` are exported.
  - `ToolRegistry` can register tools.
  - Duplicate tool names throw a clear error.
  - Empty tool names throw a clear error.
  - `get` can return a tool or `undefined`.
  - `require` returns a tool or throws a clear unknown-tool error.
  - `definitions()` returns only `ToolDefinition[]`.
  - No read/search/write/shell tool implementation is added yet.
  - No agent loop or tool execution flow is added yet.
  - `npm run check` succeeds from `ChatRealm/`.
- Reviewer checklist:
  - Confirm tool contracts stay provider-neutral.
  - Confirm `src/ai/types.ts` is reused instead of duplicated.
  - Confirm no `any` is used.
  - Confirm no dynamic imports are used.
  - Confirm registry lookup is by `definition.name`.
  - Confirm concrete tool behavior remains deferred to TODO-007 and TODO-008.

### TODO-007: Implement Read And Search Tools

- Status: pending
- Goal: Add the first real tools: one tool that reads a text file and one tool that searches text files under the current working directory.
- Scope:
  - Create `src/tools/path.ts` for shared cwd confinement.
  - Create `src/tools/read-file.ts`.
  - Create `src/tools/search.ts`.
  - Update `src/tools/registry.ts` so callers can create a default registry containing these tools.
  - Validate tool arguments at the tool boundary.
  - Keep every file access inside `ToolContext.cwd`.
  - Return concise `ToolResult` objects.
  - Do not implement write-file or shell tools yet.
  - Do not build the agent loop yet.
  - Do not add external search dependencies.
- Likely files or areas: `src/tools/path.ts`, `src/tools/read-file.ts`, `src/tools/search.ts`, `src/tools/registry.ts`
- Dependencies: TODO-006
- Reference from `pi`:
  - `pi` has richer file tools under [packages/coding-agent/src/core/tools/](../packages/coding-agent/src/core/tools/).
  - ChatRealm should keep this smaller: read text files, search text files, and enforce cwd confinement.
  - The MVP lesson is safe local tool execution, not full shell-like filesystem behavior.
- Beginner mental model:
  - The model asks for a tool by name and JSON arguments.
  - The registry finds the matching `AgentTool`.
  - The tool validates arguments, touches the filesystem, and returns text.
  - A tool should not trust model-provided paths.
  - `cwd` is the safety boundary: tools can work inside it, but not escape it with `../`.
- Before you start:
  - Check `src/tools/types.ts`.
  - If your `AgentTool` method is named `excute`, rename it to `execute` before continuing.
  - The expected interface from TODO-006 is:

    ```ts
    export interface AgentTool {
      definition: ToolDefinition;
      execute(args: JsonObject, context: ToolContext): Promise<ToolResult>;
    }
    ```
  - This spelling matters because TODO-010 will call `tool.execute(...)`.
- Step-by-step implementation guide:
  1. Create a shared path helper.

     - Create `src/tools/path.ts`.
     - Import Node path helpers:

       ```ts
       import { isAbsolute, relative, resolve } from "node:path";
       ```
     - Add a function named `resolveInsideCwd`.
     - Recommended shape:

       ```ts
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
       ```
     - Why this exists:

       - Model-provided paths are untrusted.
       - `../secret.txt` should not escape the project.
       - Absolute paths should not be accepted in this MVP.
       - Both read-file and search need the same safety rule.
  2. Add a small required-string reader.

     - You can place this helper in each tool file for now.
     - Recommended shape:

       ```ts
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
       ```
     - This is intentionally simple.
     - Do not add a full JSON schema validator yet.
     - JSON schema metadata helps the model choose arguments, but this helper is the runtime check.
  3. Create `src/tools/read-file.ts`.

     - Import `readFile` from `node:fs/promises`.
     - Import `AgentTool`.
     - Import `resolveInsideCwd`.
     - Recommended imports:

       ```ts
       import { readFile } from "node:fs/promises";
       import type { JsonObject } from "../ai/types.js";
       import type { AgentTool } from "./types.js";
       import { resolveInsideCwd } from "./path.js";
       ```
  4. Define the read-file tool metadata.

     - Export a constant named `readFileTool`.
     - Recommended definition:

       ```ts
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
         },
         async execute(args, context) {
           // Implementation goes here.
         },
       };
       ```
     - Keep the name stable: `read_file`.
     - This name is what the model will request in a tool call.
  5. Implement `read_file`.

     - Inside `execute`, use `try/catch`.
     - Read and validate `path`.
     - Resolve it through `resolveInsideCwd`.
     - Read the file as UTF-8.
     - Return text on success and an error result on failure.
     - Recommended shape:

       ```ts
       async execute(args, context) {
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
       }
       ```
     - Why tools return errors instead of always throwing:

       - Tool failures are useful information for the model.
       - Missing files, permission errors, and invalid paths should become tool-result messages later.
       - Programmer errors can still throw outside this expected execution path.
  6. Create `src/tools/search.ts`.

     - This MVP search should be simple text search, not regex search.
     - Search recursively under a relative directory.
     - Skip large dependency/build folders.
     - Recommended imports:

       ```ts
       import { readdir, readFile } from "node:fs/promises";
       import { relative } from "node:path";
       import type { JsonObject } from "../ai/types.js";
       import type { AgentTool } from "./types.js";
       import { resolveInsideCwd } from "./path.js";
       ```
  7. Define the search tool metadata.

     - Export a constant named `searchTool`.
     - Recommended arguments:

       - `query`: required string.
       - `path`: optional relative directory path, default `"."`.
       - `maxResults`: optional number, default `50`.
     - Recommended definition:

       ```ts
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
           // Implementation goes here.
         },
       };
       ```
  8. Add small argument readers for search.

     - Reuse `readRequiredString` for `query`.
     - Add optional readers:

       ```ts
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
       ```
     - Keep these local for now.
     - You can extract shared argument helpers later only if duplication becomes painful.
  9. Add a skipped-directory set.

     - Add near the top of `search.ts`:

       ```ts
       const SKIPPED_DIRECTORIES = new Set([
         ".git",
         "node_modules",
         "dist",
         "build",
         ".next",
         "coverage",
       ]);
       ```
     - This keeps search fast and avoids noisy output.
     - Do not add `.env` handling here yet; path safety and concise output are enough for this TODO.
  10. Implement recursive search.

      - Keep this simple.
      - Use `readdir(directory, { withFileTypes: true })`.
      - Recurse into directories unless skipped.
      - Try reading files as UTF-8.
      - Ignore files that cannot be read as text.
      - A helper can collect string results:

        ```ts
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
        ```
      - This uses `resolveInsideCwd(directory, entry.name)` for child paths.
      - That is acceptable because `directory` was already resolved inside the original cwd.
      - If you find this confusing, use `resolve(directory, entry.name)` after importing `resolve` from `node:path`.
  11. Implement file matching.

      - Split file content into lines.
      - Add one output line per match.
      - Recommended output format:

        ```text
        relative/path.ts:12: matched line text
        ```
      - Recommended helper:

        ```ts
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
        ```
      - This is plain text search.
      - Do not add regex, ignore files, glob syntax, ranking, or fuzzy search in this TODO.
  12. Implement `search.execute`.

      - Validate arguments.
      - Resolve the search directory through `resolveInsideCwd`.
      - Clamp `maxResults` to a reasonable range.
      - Return a concise message when no matches exist.
      - Recommended shape:

        ```ts
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
        ```
  13. Update `src/tools/registry.ts`.

      - Import the new tools:

        ```ts
        import { readFileTool } from "./read-file.js";
        import { searchTool } from "./search.js";
        ```
      - Add a default registry factory:

        ```ts
        export function createDefaultToolRegistry(): ToolRegistry {
          return createToolRegistry([readFileTool, searchTool]);
        }
        ```
      - Keep the generic `ToolRegistry` and `createToolRegistry` from TODO-006.
      - Do not register write or shell tools yet.
  14. Run type checking.

      - From `ChatRealm/`, run:

        ```powershell
        npm run check
        ```
      - Fix all TypeScript errors before moving on.
      - Common fixes:

        - If Node built-in imports fail, check `@types/node` and `tsconfig.json`.
        - If `JsonObject` rejects the JSON schema, remember schema values must be JSON-compatible.
        - If TypeScript says `execute` does not exist, check for the `excute` typo in TODO-006.
        - If `relative` output looks wrong on Windows, test with simple files inside `ChatRealm/`.
  15. Optional manual smoke check.

      - This is not a formal test suite.
      - It is a quick way to prove the tools work before the agent loop exists.
      - Create a temporary file named `tool-smoke.ts` in the `ChatRealm/` root.
      - Do not commit this file.
      - Add this script:

        ```ts
        import { createDefaultToolRegistry } from "./src/tools/registry.js";
        import { readFileTool } from "./src/tools/read-file.js";
        import { searchTool } from "./src/tools/search.js";
        import type { ToolContext } from "./src/tools/types.js";

        const context: ToolContext = {
          cwd: process.cwd(),
        };

        const registry = createDefaultToolRegistry();
        const toolNames = registry.definitions().map((definition) => definition.name);

        if (!toolNames.includes("read_file")) {
          throw new Error("Default registry is missing read_file");
        }

        if (!toolNames.includes("search")) {
          throw new Error("Default registry is missing search");
        }

        const readResult = await readFileTool.execute(
          { path: "package.json" },
          context,
        );

        if (readResult.isError) {
          throw new Error(`read_file failed: ${readResult.content}`);
        }

        if (!readResult.content.includes("\"scripts\"")) {
          throw new Error("read_file did not read ChatRealm/package.json");
        }

        const searchResult = await searchTool.execute(
          {
            query: "\"scripts\"",
            path: ".",
            maxResults: 10,
          },
          context,
        );

        if (searchResult.isError) {
          throw new Error(`search failed: ${searchResult.content}`);
        }

        if (!searchResult.content.includes("package.json")) {
          throw new Error("search did not find package.json");
        }

        const escapeResult = await readFileTool.execute(
          { path: "../package.json" },
          context,
        );

        if (!escapeResult.isError) {
          throw new Error("read_file allowed a path escape");
        }

        console.log("tool smoke ok");
        ```
      - Run it from `ChatRealm/`:

        ```powershell
        npm exec tsx -- ./tool-smoke.ts
        ```
      - Expected output:

        ```text
        tool smoke ok
        ```
      - What this smoke check proves:

        - The default registry includes both tools.
        - `read_file` can read `package.json`.
        - `search` can find text in project files.
        - `read_file` rejects a `../` path escape.
      - If it fails:

        - If TypeScript says `execute` does not exist, fix the `excute` typo in `src/tools/types.ts`.
        - If imports fail, check that file names and `.js` import suffixes match.
        - If path escape does not fail, inspect `resolveInsideCwd`.
        - If search finds too much output, lower `maxResults`.
      - Delete the scratch file afterward:

        ```powershell
        Remove-Item .\tool-smoke.ts
        ```
- Beginner notes:
  - Path normalization means turning a user path like `src/../package.json` into one canonical path.
  - Cwd confinement means rejecting paths that escape the project root.
  - A tool error is still a valid tool result; it helps the model recover.
  - `read_file` should return the whole file for now.
  - `search` should return concise matching lines, not entire files.
  - Keep search boring and predictable; better search can come later.
- Acceptance criteria:
  - `src/tools/path.ts` exists and prevents absolute paths and `../` escapes.
  - `src/tools/read-file.ts` exports `readFileTool`.
  - `src/tools/search.ts` exports `searchTool`.
  - `read_file` accepts a `path` argument.
  - `read_file` reads UTF-8 text inside `cwd`.
  - `search` accepts `query`, optional `path`, and optional `maxResults`.
  - `search` searches recursively inside `cwd`.
  - `search` skips common dependency/build folders.
  - Tool failures return `{ isError: true }` with a clear message.
  - `createDefaultToolRegistry()` includes `readFileTool` and `searchTool`.
  - No write-file or shell command tool is added yet.
  - No agent loop is added yet.
  - `npm run check` succeeds from `ChatRealm/`.
- Reviewer checklist:
  - Confirm model-provided paths cannot escape `ToolContext.cwd`.
  - Confirm tool argument validation happens before filesystem access.
  - Confirm output is concise enough to send back to the model.
  - Confirm no `any` is used.
  - Confirm no dynamic imports are used.
  - Confirm TODO-008 remains responsible for write and shell tools.

### TODO-008: Implement Write And Shell Tools

- Status: pending
- Goal: Add the first tools that can change local state: writing files and running shell commands.
- Scope:

  - Create `src/tools/write-file.ts`.
  - Create `src/tools/shell.ts`.
  - Reuse `resolveInsideCwd` from `src/tools/path.ts`.
  - Update `src/tools/registry.ts` so the default registry includes read, search, write, and shell tools.
  - Validate tool arguments before doing filesystem or shell work.
  - Keep file writes inside `ToolContext.cwd`.
  - Run shell commands with `cwd`, timeout, output limits, and structured results.
  - Do not build approvals yet.
  - Do not add a sandbox yet.
  - Do not build the agent loop yet.
- Likely files or areas: `src/tools/write-file.ts`, `src/tools/shell.ts`, `src/tools/registry.ts`
- Dependencies: TODO-006, TODO-007
- Reference from `pi`:

  - `pi` has a much more careful shell tool and approval model under [packages/coding-agent/src/core/tools/](../packages/coding-agent/src/core/tools/).
  - ChatRealm should keep TODO-008 smaller.
  - The MVP shell tool is not a security sandbox. It only sets cwd, timeout, and output limits.
- Beginner mental model:

  - Read/search tools observe the project.
  - Write/shell tools can change the project.
  - That means their boundaries matter more.
  - `write_file` should enforce path confinement.
  - `shell_command` should return stdout, stderr, and exit code instead of crashing the whole program.
- Before you start:

  - Finish TODO-007 first.
  - From `ChatRealm/`, run `npm run check`.
  - Fix any TODO-007 type errors before adding TODO-008.
  - Confirm `src/tools/path.ts` exports `resolveInsideCwd`.
  - Confirm `AgentTool` uses `execute`, not `excute`.
- Step-by-step implementation guide:

  1. Create `src/tools/write-file.ts`.

     - Import `mkdir` and `writeFile` from `node:fs/promises`.
     - Import `dirname` from `node:path`.
     - Import `AgentTool`, `JsonObject`, and `resolveInsideCwd`.
     - Recommended imports:

       ```ts
       import { mkdir, writeFile } from "node:fs/promises";
       import { dirname } from "node:path";
       import type { JsonObject } from "../ai/types.js";
       import { resolveInsideCwd } from "./path.js";
       import type { AgentTool } from "./types.js";
       ```
  2. Add small argument readers in `write-file.ts`.

     - Add `readRequiredString` for `path` and `content`.
     - Add `readOptionalBoolean` for `overwrite`.
     - Recommended shape:

       ```ts
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
       ```
     - Do not require `content` to be non-empty.
     - Empty content is valid because writing an empty file can be intentional.
  3. Define the write-file tool metadata.

     - Export a constant named `writeFileTool`.
     - Recommended name: `write_file`.
     - Recommended arguments:

       - `path`: required relative file path.
       - `content`: required string content.
       - `overwrite`: optional boolean, default `false`.
     - Recommended definition:

       ```ts
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
           // Implementation goes here.
         },
       };
       ```
  4. Implement `write_file`.

     - Validate arguments.
     - Resolve `path` through `resolveInsideCwd`.
     - Create the parent directory.
     - Use `flag: "wx"` when `overwrite` is false.
     - Use `flag: "w"` when `overwrite` is true.
     - Recommended shape:

       ```ts
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
       ```
     - Why default `overwrite` is false:

       - It prevents accidental file replacement while learning.
       - Later the agent can explicitly request `overwrite: true` when it means to replace a file.
  5. Create `src/tools/shell.ts`.

     - Use Node's `exec` for the MVP because it accepts one command string.
     - Import the type `ExecException` so no `any` is needed.
     - Recommended imports:

       ```ts
       import { exec, type ExecException } from "node:child_process";
       import type { JsonObject } from "../ai/types.js";
       import type { AgentTool } from "./types.js";
       ```
  6. Add shell constants.

     - Add conservative defaults:

       ```ts
       const DEFAULT_TIMEOUT_MS = 30_000;
       const MAX_TIMEOUT_MS = 120_000;
       const MAX_BUFFER_BYTES = 1024 * 1024;
       ```
     - `DEFAULT_TIMEOUT_MS` keeps commands from hanging forever.
     - `MAX_TIMEOUT_MS` prevents the model from requesting very long commands.
     - `MAX_BUFFER_BYTES` prevents huge output from consuming too much memory.
  7. Add shell argument readers.

     - Add `readRequiredString` for `command`.
     - Add `readOptionalNumber` for `timeoutMs`.
     - Recommended timeout helper:

       ```ts
       function clampTimeout(timeoutMs: number | undefined): number {
         if (timeoutMs === undefined) {
           return DEFAULT_TIMEOUT_MS;
         }

         return Math.max(1_000, Math.min(MAX_TIMEOUT_MS, Math.floor(timeoutMs)));
       }
       ```
  8. Define a small shell execution result.

     - Add an internal interface:

       ```ts
       interface ShellExecution {
         stdout: string;
         stderr: string;
         exitCode: number;
       }
       ```
     - This keeps process execution separate from tool-result formatting.
  9. Add `runShellCommand`.

     - Wrap `exec` in a Promise.
     - Always resolve with stdout, stderr, and exit code.
     - Recommended shape:

       ```ts
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
       ```
     - The shell tool should not throw for non-zero exit codes.
     - Non-zero exit codes are normal command results.
  10. Add `getExitCode`.

      - Recommended shape:

        ```ts
        function getExitCode(error: ExecException | null): number {
          if (error === null) {
            return 0;
          }

          if (typeof error.code === "number") {
            return error.code;
          }

          return 1;
        }
        ```
      - This keeps failed commands from becoming unclear JavaScript exceptions.
  11. Add shell output formatting.

      - Keep output concise and explicit.
      - Recommended helper:

        ```ts
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
        ```
  12. Define the shell tool metadata.

      - Export a constant named `shellTool`.
      - Recommended name: `shell_command`.
      - Recommended arguments:

        - `command`: required string.
        - `timeoutMs`: optional number.
      - Recommended definition:

        ```ts
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
            // Implementation goes here.
          },
        };
        ```
  13. Implement `shell_command`.

      - Validate `command`.
      - Clamp `timeoutMs`.
      - Run the command in `context.cwd`.
      - Return `isError: true` for non-zero exit code.
      - Recommended shape:

        ```ts
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
        ```

  - Important safety note:
    - This does not fully sandbox shell commands.
    - It only sets the working directory, timeout, and output limit.
    - Do not expose this to untrusted prompts as if it were safe.

  14. Update `src/tools/registry.ts`.
      - Import the new tools:

        ```ts
        import { shellTool } from "./shell.js";
        import { writeFileTool } from "./write-file.js";
        ```
      - Update `createDefaultToolRegistry`:

        ```ts
        export function createDefaultToolRegistry(): ToolRegistry {
          return createToolRegistry([
            readFileTool,
            searchTool,
            writeFileTool,
            shellTool,
          ]);
        }
        ```
      - Keep read and search tools registered.
      - Do not add agent-loop execution here.
  15. Run type checking.
      - From `ChatRealm/`, run:

        ```powershell
        npm run check
        ```
      - Fix all TypeScript errors before moving on.
      - Common fixes:

        - If `ExecException` import fails, check the exact `node:child_process` import.
        - If `writeFile` options fail, check the object form `{ encoding, flag }`.
        - If `execute` does not exist, check the `AgentTool` interface spelling.
        - If registry has duplicate tool names, check each `definition.name`.
  16. Optional manual smoke check.
      - This is not a formal test suite.
      - It is a quick end-to-end check for TODO-008 before the agent loop exists.
      - Create a temporary file named `tool-smoke.ts` in the `ChatRealm/` root.
      - Do not commit this file.
      - Add this script:

        ```ts
        import { readFile, rm } from "node:fs/promises";
        import { createDefaultToolRegistry } from "./src/tools/registry.js";
        import { shellTool } from "./src/tools/shell.js";
        import type { ToolContext } from "./src/tools/types.js";
        import { writeFileTool } from "./src/tools/write-file.js";

        const context: ToolContext = {
          cwd: process.cwd(),
        };

        const smokeDir = ".tmp-tool-smoke";
        const smokeFile = `${smokeDir}/sample.txt`;

        await rm(smokeDir, { recursive: true, force: true });

        try {
          const registry = createDefaultToolRegistry();
          const toolNames = registry.definitions().map((definition) => definition.name);

          if (!toolNames.includes("write_file")) {
            throw new Error("Default registry is missing write_file");
          }

          if (!toolNames.includes("shell_command")) {
            throw new Error("Default registry is missing shell_command");
          }

          const firstWrite = await writeFileTool.execute(
            {
              path: smokeFile,
              content: "first write\n",
            },
            context,
          );

          if (firstWrite.isError) {
            throw new Error(`write_file first write failed: ${firstWrite.content}`);
          }

          const firstContent = await readFile(smokeFile, "utf8");

          if (firstContent !== "first write\n") {
            throw new Error("write_file wrote unexpected first content");
          }

          const blockedOverwrite = await writeFileTool.execute(
            {
              path: smokeFile,
              content: "blocked overwrite\n",
            },
            context,
          );

          if (!blockedOverwrite.isError) {
            throw new Error("write_file overwrote an existing file without overwrite=true");
          }

          const overwrite = await writeFileTool.execute(
            {
              path: smokeFile,
              content: "second write\n",
              overwrite: true,
            },
            context,
          );

          if (overwrite.isError) {
            throw new Error(`write_file overwrite failed: ${overwrite.content}`);
          }

          const secondContent = await readFile(smokeFile, "utf8");

          if (secondContent !== "second write\n") {
            throw new Error("write_file overwrite wrote unexpected content");
          }

          const escapeWrite = await writeFileTool.execute(
            {
              path: "../tool-smoke-escape.txt",
              content: "escape\n",
            },
            context,
          );

          if (!escapeWrite.isError) {
            throw new Error("write_file allowed a path escape");
          }

          const shellSuccess = await shellTool.execute(
            {
              command: "node -e \"console.log('ok')\"",
            },
            context,
          );

          if (shellSuccess.isError) {
            throw new Error(`shell_command success command failed: ${shellSuccess.content}`);
          }

          if (!shellSuccess.content.includes("ok")) {
            throw new Error("shell_command success output did not include ok");
          }

          const shellFailure = await shellTool.execute(
            {
              command: "node -e \"process.exit(2)\"",
            },
            context,
          );

          if (!shellFailure.isError) {
            throw new Error("shell_command did not mark non-zero exit as an error");
          }

          if (!shellFailure.content.includes("Exit code: 2")) {
            throw new Error("shell_command failure output did not include exit code 2");
          }

          console.log("todo-008 smoke ok");
        } finally {
          await rm(smokeDir, { recursive: true, force: true });
        }
        ```
      - Run it from `ChatRealm/`:

        ```powershell
        npm exec tsx -- ./tool-smoke.ts
        ```
      - Expected output:

        ```text
        todo-008 smoke ok
        ```
      - What this smoke check proves:

        - The default registry includes `write_file` and `shell_command`.
        - `write_file` creates parent directories.
        - `write_file` writes UTF-8 content.
        - `write_file` refuses to overwrite by default.
        - `write_file` overwrites only when `overwrite: true`.
        - `write_file` rejects a `../` path escape.
        - `shell_command` captures successful stdout.
        - `shell_command` marks non-zero exit codes as `isError: true`.
      - If it fails:

        - If imports fail, check file names and `.js` import suffixes.
        - If `writeFileTool.execute` is missing, check the `AgentTool` method name.
        - If overwrite is not blocked, check the `flag: "wx"` write option.
        - If path escape is allowed, inspect `resolveInsideCwd`.
        - If shell output is missing, inspect `formatShellResult`.
        - If exit code `2` is not detected, inspect `getExitCode`.
      - Delete the scratch script afterward:

        ```powershell
        Remove-Item .\tool-smoke.ts
        ```
- Beginner notes:

  - `write_file` is still safer than shell because it can enforce cwd path confinement.
  - `shell_command` is powerful and dangerous; cwd and timeout are guardrails, not a sandbox.
  - A command with exit code `1` should return a tool result, not crash the process.
  - Keep stdout and stderr both visible so later agent behavior is debuggable.
  - Do not hide stderr just because stdout exists.
- Acceptance criteria:

  - `src/tools/write-file.ts` exports `writeFileTool`.
  - `src/tools/shell.ts` exports `shellTool`.
  - `write_file` accepts `path`, `content`, and optional `overwrite`.
  - `write_file` rejects paths outside `cwd`.
  - `write_file` defaults to not overwriting existing files.
  - `shell_command` accepts `command` and optional `timeoutMs`.
  - `shell_command` runs in `ToolContext.cwd`.
  - `shell_command` returns stdout, stderr, and exit code.
  - Non-zero shell exit codes produce `isError: true`.
  - `createDefaultToolRegistry()` includes read, search, write, and shell tools.
  - No agent loop is added yet.
  - No approvals or sandbox system is added yet.
  - `npm run check` succeeds from `ChatRealm/`.
- Reviewer checklist:

  - Confirm file writes cannot escape `ToolContext.cwd`.
  - Confirm shell command output includes both stdout and stderr.
  - Confirm shell timeout is enforced.
  - Confirm no `any` is used.
  - Confirm no dynamic imports are used.
  - Confirm TODO-010 remains responsible for deciding when to execute requested tools.

### TODO-009: Build Minimal Agent State

- Status: pending
- Goal: Define the in-memory state shape that TODO-010's agent loop can read from and append to.
- Scope:
  - Create `src/agent/`.
  - Create `src/agent/state.ts`.
  - Create `src/agent/prompt.ts`.
  - Store current `cwd`.
  - Store selected `model`.
  - Store `systemPrompt`.
  - Store conversation `messages`.
  - Store minimal run metadata such as turn count, max turns, started time, and updated time.
  - Add small helper functions for appending user, assistant, and tool-result messages.
  - Do not call the model yet.
  - Do not execute tools yet.
  - Do not persist sessions to disk yet.
  - Do not build the agent loop yet.
- Likely files or areas: `src/agent/state.ts`, `src/agent/prompt.ts`
- Dependencies: TODO-004, TODO-006
- Reference from `pi`:
  - `pi` has a much larger session abstraction in [packages/coding-agent/src/core/agent-session.ts](../packages/coding-agent/src/core/agent-session.ts).
  - ChatRealm should not copy that.
  - The MVP lesson is smaller: keep enough state to build a `ChatRequest` and continue after tool results.
- Beginner mental model:
  - The agent loop is a repeated conversation.
  - `AgentState` is the notebook for that conversation.
  - User messages, assistant messages, and tool-result messages all go into one ordered `messages` array.
  - Tool results are not separate magic; they are messages with role `"toolResult"`.
  - TODO-009 creates the notebook. TODO-010 writes the loop that uses it.
- Step-by-step implementation guide:
  1. Create the agent folder.
     - Create `src/agent/`.
     - Create `src/agent/state.ts`.
     - Create `src/agent/prompt.ts`.
  2. Add imports in `src/agent/state.ts`.
     - Import message types from `src/ai/types.ts`.
     - Import `ToolResult` from `src/tools/types.ts`.
     - Recommended imports:

       ```ts
       import type {
         AssistantMessage,
         Message,
         ToolResultMessage,
         UserMessage,
       } from "../ai/types.js";
       import type { ToolResult } from "../tools/types.js";
       ```
     - Why these types are reused:

       - `ChatRequest.messages` already expects `Message[]`.
       - `ToolResultMessage` already has the shape TODO-010 will append after tool execution.
       - Reusing types avoids translating state messages into different message shapes later.
  3. Define state creation options.
     - Export an interface named `CreateAgentStateOptions`.
     - Recommended shape:

       ```ts
       export interface CreateAgentStateOptions {
         cwd: string;
         model: string;
         systemPrompt: string | undefined;
         maxTurns?: number;
       }
       ```
     - `cwd` and `model` are required because the loop needs both.
     - `systemPrompt` is explicit so callers decide whether to use the default prompt.
     - `maxTurns` is optional because state can default it.
  4. Define run metadata.
     - Export an interface named `AgentRunMetadata`.
     - Recommended shape:

       ```ts
       export interface AgentRunMetadata {
         turnCount: number;
         maxTurns: number;
         startedAt: string;
         updatedAt: string;
       }
       ```
     - `turnCount` helps TODO-010 stop infinite loops.
     - `maxTurns` is the limit.
     - ISO strings are simple to inspect and later persist in TODO-012.
  5. Define `AgentState`.
     - Export an interface named `AgentState`.
     - Recommended shape:

       ```ts
       export interface AgentState {
         cwd: string;
         model: string;
         systemPrompt: string | undefined;
         messages: Message[];
         run: AgentRunMetadata;
       }
       ```
     - Keep the state small.
     - Do not add token accounting, cost, session IDs, branches, UI state, or persistence yet.
  6. Add `createAgentState`.
     - Export a function named `createAgentState`.
     - Recommended shape:

       ```ts
       export function createAgentState(options: CreateAgentStateOptions): AgentState {
         const now = new Date().toISOString();

         return {
           cwd: options.cwd,
           model: options.model,
           systemPrompt: options.systemPrompt,
           messages: [],
           run: {
             turnCount: 0,
             maxTurns: options.maxTurns ?? 10,
             startedAt: now,
             updatedAt: now,
           },
         };
       }
       ```
     - Defaulting to `10` turns keeps the future loop from running forever.
  7. Add a timestamp helper.
     - Add a small internal function:

       ```ts
       function touch(state: AgentState): void {
         state.run.updatedAt = new Date().toISOString();
       }
       ```
     - This mutates state intentionally.
     - For this MVP, mutable in-memory state is simpler than immutable state updates.
  8. Add `appendUserMessage`.
     - Export a function that appends a user message.
     - Recommended shape:

       ```ts
       export function appendUserMessage(state: AgentState, content: string): void {
         const message: UserMessage = {
           role: "user",
           content,
         };

         state.messages.push(message);
         touch(state);
       }
       ```
     - Do not trim or validate the prompt here.
     - CLI input validation belongs closer to CLI code.
  9. Add `appendAssistantMessage`.
     - Export a function that appends an assistant message.
     - Recommended shape:

       ```ts
       export function appendAssistantMessage(
         state: AgentState,
         message: AssistantMessage,
       ): void {
         state.messages.push(message);
         touch(state);
       }
       ```
     - The provider adapter already returns an `AssistantMessage`.
     - State should store it as-is.
  10. Add `appendToolResultMessage`.
      - Export a function that converts a `ToolResult` into a `ToolResultMessage`.
      - Recommended shape:

        ```ts
        export function appendToolResultMessage(
          state: AgentState,
          toolCallId: string,
          toolName: string,
          result: ToolResult,
        ): void {
          const message: ToolResultMessage = {
            role: "toolResult",
            toolCallId,
            toolName,
            content: result.content,
            isError: result.isError,
          };

          state.messages.push(message);
          touch(state);
        }
        ```
      - This is the bridge between tool execution and the next provider request.
      - TODO-010 will call this after it executes a requested tool.
  11. Add turn helpers.
      - Export `incrementTurn`.
      - Export `hasRemainingTurns`.
      - Recommended shape:

        ```ts
        export function incrementTurn(state: AgentState): void {
          state.run.turnCount += 1;
          touch(state);
        }

        export function hasRemainingTurns(state: AgentState): boolean {
          return state.run.turnCount < state.run.maxTurns;
        }
        ```
      - TODO-010 will use these to stop after too many model/tool cycles.
  12. Add `src/agent/prompt.ts`.
      - Export a default system prompt builder.
      - Recommended shape:

        ```ts
        export function buildDefaultSystemPrompt(): string {
          return [
            "You are ChatRealm, a local coding assistant.",
            "Answer clearly and directly.",
            "Use tools when you need to inspect, search, write, or run local project commands.",
            "When a tool returns an error, use the error message to decide the next step.",
            "Do not claim you changed files unless a tool result confirms it.",
          ].join("\n");
        }
        ```
      - Keep this prompt short.
      - Do not copy a large prompt from `pi`.
      - TODO-011 can wire this into CLI execution.
  13. Optional convenience function.
      - If you want one simple constructor for the common case, add:

        ```ts
        import { buildDefaultSystemPrompt } from "./prompt.js";

        export function createDefaultAgentState(
          cwd: string,
          model: string,
        ): AgentState {
          return createAgentState({
            cwd,
            model,
            systemPrompt: buildDefaultSystemPrompt(),
          });
        }
        ```
      - This is optional.
      - If adding it creates import cycles or confusion, skip it.
  14. Run type checking.
      - From `ChatRealm/`, run:

        ```powershell
        npm run check
        ```
      - Fix all TypeScript errors before moving on.
      - Common fixes:

        - If imports fail, check `.js` import suffixes.
        - If `ToolResultMessage` fields do not match, compare with `src/ai/types.ts`.
        - If `ToolResult` import fails, check `src/tools/types.ts`.
        - If date values are not strings, use `new Date().toISOString()`.
  15. Optional manual smoke check.
      - Create a temporary `agent-state-smoke.ts` in `ChatRealm/`.
      - Do not commit it.
      - Add this script:

        ```ts
        import {
          appendAssistantMessage,
          appendToolResultMessage,
          appendUserMessage,
          createAgentState,
          hasRemainingTurns,
          incrementTurn,
        } from "./src/agent/state.js";
        import { buildDefaultSystemPrompt } from "./src/agent/prompt.js";

        const state = createAgentState({
          cwd: process.cwd(),
          model: "test-model",
          systemPrompt: buildDefaultSystemPrompt(),
          maxTurns: 2,
        });

        appendUserMessage(state, "hello");

        appendAssistantMessage(state, {
          role: "assistant",
          content: [{ type: "text", text: "hi" }],
          model: "test-model",
          usage: undefined,
          stopReason: "stop",
          errorMessage: undefined,
        });

        appendToolResultMessage(state, "call-1", "read_file", {
          content: "file content",
          isError: false,
        });

        if (state.messages.length !== 3) {
          throw new Error("Expected three messages");
        }

        if (state.messages[0]?.role !== "user") {
          throw new Error("First message should be user");
        }

        if (state.messages[2]?.role !== "toolResult") {
          throw new Error("Third message should be toolResult");
        }

        if (!hasRemainingTurns(state)) {
          throw new Error("State should have remaining turns before incrementing");
        }

        incrementTurn(state);
        incrementTurn(state);

        if (hasRemainingTurns(state)) {
          throw new Error("State should not have remaining turns after two turns");
        }

        console.log("todo-009 smoke ok");
        ```
      - Run it from `ChatRealm/`:

        ```powershell
        npm exec tsx -- ./agent-state-smoke.ts
        ```
      - Expected output:

        ```text
        todo-009 smoke ok
        ```
      - Delete the scratch script afterward:

        ```powershell
        Remove-Item .\agent-state-smoke.ts
        ```
- Beginner notes:
  - State is not the agent loop.
  - State only records what has happened and what settings the loop needs.
  - Keeping all messages in one ordered array makes provider requests easier later.
  - Tool results become `ToolResultMessage` entries.
  - Persistence is intentionally postponed to TODO-012.
- Acceptance criteria:
  - `src/agent/state.ts` exists.
  - `src/agent/prompt.ts` exists.
  - `AgentState`, `AgentRunMetadata`, and `CreateAgentStateOptions` are exported.
  - `createAgentState` creates an empty in-memory state.
  - User messages can be appended.
  - Assistant messages can be appended.
  - Tool results can be appended as `ToolResultMessage`.
  - Turn count can be incremented.
  - Remaining-turn checks work.
  - A default system prompt builder exists.
  - No model call is made.
  - No tool is executed.
  - No session persistence is added.
  - `npm run check` succeeds from `ChatRealm/`.
- Reviewer checklist:
  - Confirm state uses provider-neutral message types from `src/ai/types.ts`.
  - Confirm tool result state uses `ToolResult` from `src/tools/types.ts`.
  - Confirm no `any` is used.
  - Confirm no dynamic imports are used.
  - Confirm state does not know about OpenAI-specific response shapes.
  - Confirm TODO-010 remains responsible for model calls and tool execution.

### TODO-010: Implement Agent Loop

- Status: pending
- Goal: Build the first real agent loop: send conversation state to the model, detect tool calls in the assistant response, execute those tools, append tool-result messages, and repeat until the model returns a final answer or the run reaches `maxTurns`.
- Scope:
  - Create `src/agent/agent-loop.ts`.
  - Optionally create `src/agent/agent.ts` as a small public wrapper if it makes TODO-011 easier.
  - Use the existing `ChatTransport` abstraction from `src/ai/types.ts`.
  - Use the existing `ToolRegistry` from `src/tools/registry.ts`.
  - Use the existing state helpers from `src/agent/state.ts`.
  - Build a `ChatRequest` from `AgentState`.
  - Call `transport.complete(request)` once per loop turn.
  - Append every assistant response to state.
  - Extract `toolCall` content blocks from assistant messages.
  - Execute requested tools with `ToolContext.cwd`.
  - Append each tool result as a `toolResult` message.
  - Stop when the assistant response has no tool calls.
  - Stop with a clear error when max turns are exhausted before a final answer.
  - Do not wire the CLI end to end yet; TODO-011 owns that.
  - Do not add session persistence yet; TODO-012 owns that.
  - Do not add advanced approval/sandbox logic yet.
  - Do not add streaming yet.
- Likely files or areas: `src/agent/agent-loop.ts`, `src/agent/agent.ts`, `test/agent-loop.test.ts`
- Dependencies: TODO-005, TODO-006, TODO-009
- Reference from `pi`:
  - `pi` has a much richer runtime around sessions, event streams, approvals, provider routing, and UI updates.
  - ChatRealm should implement only the minimum loop pattern:
    1. request model
    2. save assistant message
    3. run requested tools
    4. save tool results
    5. request model again
  - Do not copy production event/session architecture from `pi`.
- Beginner mental model:
  - The loop is not the provider and not the tools.
  - The provider decides what to say or which tools to call.
  - The registry decides whether a named tool exists.
  - The tool itself decides how to execute.
  - The state records every user, assistant, and tool-result message in order.
  - The loop is the coordinator that connects those pieces.
  - After a tool result is appended, the next provider call includes that result so the model can continue from real observations.
- Important behavior:
  - A final assistant answer is an assistant message with zero `toolCall` content blocks.
  - A tool-use turn is an assistant message with one or more `toolCall` content blocks.
  - Tool errors should not crash the loop. They should be appended as `toolResult` messages with `isError: true` so the model can react.
  - Unknown tool names should also become tool-result errors, not unhandled exceptions.
  - Provider errors may throw for now; TODO-013 will normalize user-facing error output.
  - Max-turn exhaustion should throw a clear error because it means the model did not produce a final answer in time.
- Step-by-step implementation guide:
  1. Create the agent loop file.
     - Create `src/agent/agent-loop.ts`.
     - This file should contain the core loop only.
     - Do not import CLI parsing or config loading here.
  2. Add imports.
     - Import the provider and message types:

       ```ts
       import type {
         AssistantMessage,
         ChatRequest,
         ChatTransport,
         ToolCallContent,
       } from "../ai/types.js";
       ```

     - Import the tool registry:

       ```ts
       import type { ToolRegistry } from "../tools/registry.js";
       ```

     - Import state helpers:

       ```ts
       import {
         appendAssistantMessage,
         appendToolResultMessage,
         hasRemainingTurns,
         incrementTurn,
         type AgentState,
       } from "./state.js";
       ```

     - Keep imports type-only when the imported value is only used as a TypeScript type.
     - Keep `.js` suffixes on local imports because the project uses Node ESM.
  3. Define loop options.
     - Export an interface named `RunAgentLoopOptions`.
     - Recommended shape:

       ```ts
       export interface RunAgentLoopOptions {
         state: AgentState;
         transport: ChatTransport;
         tools: ToolRegistry;
       }
       ```

     - Why these three inputs exist:
       - `state` contains model, cwd, system prompt, messages, and turn metadata.
       - `transport` is the model boundary.
       - `tools` is the local action boundary.
  4. Define loop result.
     - Export an interface named `RunAgentLoopResult`.
     - Recommended shape:

       ```ts
       export interface RunAgentLoopResult {
         state: AgentState;
         finalMessage: AssistantMessage;
       }
       ```

     - Returning `state` is convenient for TODO-011 and TODO-012.
     - Returning `finalMessage` makes print mode simple because it can render only the final assistant response.
  5. Add a helper to build model requests.
     - Add a small function named `createChatRequest`.
     - Recommended shape:

       ```ts
       function createChatRequest(
         state: AgentState,
         tools: ToolRegistry,
       ): ChatRequest {
         return {
           model: state.model,
           systemPrompt: state.systemPrompt,
           messages: state.messages,
           tools: tools.definitions(),
         };
       }
       ```

     - This keeps the request shape easy to inspect.
     - Do not clone messages for this MVP unless you have a concrete mutation bug.
  6. Add a helper to extract tool calls.
     - Add a function named `getToolCalls`.
     - Recommended shape:

       ```ts
       function getToolCalls(message: AssistantMessage): ToolCallContent[] {
         return message.content.filter((content) => content.type === "toolCall");
       }
       ```

     - TypeScript should narrow the filtered content to `ToolCallContent[]`.
     - If TypeScript does not narrow automatically, use a small type guard:

       ```ts
       function isToolCallContent(content: AssistantMessage["content"][number]): content is ToolCallContent {
         return content.type === "toolCall";
       }
       ```

     - Then use `message.content.filter(isToolCallContent)`.
  7. Implement `runAgentLoop`.
     - Export an async function named `runAgentLoop`.
     - Recommended skeleton:

       ```ts
       export async function runAgentLoop(
         options: RunAgentLoopOptions,
       ): Promise<RunAgentLoopResult> {
         const { state, transport, tools } = options;

         while (hasRemainingTurns(state)) {
           incrementTurn(state);

           const response = await transport.complete(createChatRequest(state, tools));
           const message = response.message;

           appendAssistantMessage(state, message);

           const toolCalls = getToolCalls(message);

           if (toolCalls.length === 0) {
             return {
               state,
               finalMessage: message,
             };
           }

           for (const toolCall of toolCalls) {
             await executeToolCall(state, tools, toolCall);
           }
         }

         throw new Error(`Agent loop reached max turns (${state.run.maxTurns}) before a final answer`);
       }
       ```

     - Increment the turn before each provider call.
     - One turn means one model request, not one tool execution.
     - Append the assistant message before executing tools because OpenAI-style APIs expect the assistant tool-call message to appear before tool results.
  8. Implement tool-call execution.
     - Add a helper named `executeToolCall`.
     - Recommended shape:

       ```ts
       async function executeToolCall(
         state: AgentState,
         tools: ToolRegistry,
         toolCall: ToolCallContent,
       ): Promise<void> {
         const tool = tools.get(toolCall.name);

         if (tool === undefined) {
           appendToolResultMessage(state, toolCall.id, toolCall.name, {
             content: `Unknown tool: ${toolCall.name}`,
             isError: true,
           });
           return;
         }

         try {
           const result = await tool.execute(toolCall.arguments, {
             cwd: state.cwd,
           });

           appendToolResultMessage(state, toolCall.id, toolCall.name, result);
         } catch (error) {
           appendToolResultMessage(state, toolCall.id, toolCall.name, {
             content: formatToolExecutionError(error),
             isError: true,
           });
         }
       }
       ```

     - Use `tools.get()` instead of `tools.require()` so unknown tools can become model-visible tool errors.
     - Do not let one failed tool call prevent later tool calls in the same assistant message from running.
     - The tool context should use only `state.cwd` for now.
  9. Add a small error formatter.
     - Add an internal helper:

       ```ts
       function formatToolExecutionError(error: unknown): string {
         if (error instanceof Error) {
           return error.message;
         }

         return "Tool execution failed with a non-Error value";
       }
       ```

     - Do not use `any`.
     - Keep this local for now; TODO-013 can introduce shared error utilities later.
  10. Decide whether to add `src/agent/agent.ts`.
      - If you want a public wrapper for later print mode, create `src/agent/agent.ts`.
      - Keep it tiny.
      - Suggested responsibility:
        - accept an already-created state, transport, and registry
        - call `runAgentLoop`
        - return the result
      - If this file feels redundant, skip it for TODO-010 and let TODO-011 create it when wiring the CLI.
      - Do not create a large `Agent` class yet.
  11. Add a temporary fake-provider smoke check.
      - Because test infrastructure is still minimal, a temporary script is enough in this TODO.
      - Create `agent-loop-smoke.ts` in `ChatRealm/`.
      - Do not commit it.
      - Use a fake `ChatTransport` that returns:
        1. first response: assistant requests `read_file`
        2. second response: assistant returns final text
      - Example:

        ```ts
        import { createAgentState } from "./src/agent/state.js";
        import { runAgentLoop } from "./src/agent/agent-loop.js";
        import { createToolRegistry } from "./src/tools/registry.js";
        import type { AgentTool } from "./src/tools/types.js";
        import type { ChatRequest, ChatResponse, ChatTransport } from "./src/ai/types.js";

        const calls: ChatRequest[] = [];

        const transport: ChatTransport = {
          async complete(request: ChatRequest): Promise<ChatResponse> {
            calls.push(request);

            if (calls.length === 1) {
              return {
                message: {
                  role: "assistant",
                  content: [
                    {
                      type: "toolCall",
                      id: "call-1",
                      name: "read_file",
                      arguments: { path: "README.md" },
                    },
                  ],
                  model: request.model,
                  usage: undefined,
                  stopReason: "toolUse",
                  errorMessage: undefined,
                },
              };
            }

            return {
              message: {
                role: "assistant",
                content: [{ type: "text", text: "Read complete." }],
                model: request.model,
                usage: undefined,
                stopReason: "stop",
                errorMessage: undefined,
              },
            };
          },
        };

        const readFileTool: AgentTool = {
          definition: {
            name: "read_file",
            description: "Fake read file tool",
            parameters: {
              type: "object",
              properties: {
                path: { type: "string" },
              },
              required: ["path"],
            },
          },
          async execute() {
            return {
              content: "fake file content",
              isError: false,
            };
          },
        };

        const state = createAgentState({
          cwd: process.cwd(),
          model: "fake-model",
          systemPrompt: "test prompt",
          maxTurns: 3,
        });

        state.messages.push({
          role: "user",
          content: "read the README",
        });

        const result = await runAgentLoop({
          state,
          transport,
          tools: createToolRegistry([readFileTool]),
        });

        if (result.finalMessage.content[0]?.type !== "text") {
          throw new Error("Expected final text response");
        }

        if (state.messages.length !== 4) {
          throw new Error(`Expected 4 messages, got ${state.messages.length}`);
        }

        if (state.messages[2]?.role !== "toolResult") {
          throw new Error("Expected third message to be a tool result");
        }

        if (calls.length !== 2) {
          throw new Error(`Expected 2 model calls, got ${calls.length}`);
        }

        console.log("todo-010 smoke ok");
        ```

      - Run it from `ChatRealm/`:

        ```powershell
        npm exec tsx -- ./agent-loop-smoke.ts
        ```

      - Expected output:

        ```text
        todo-010 smoke ok
        ```

      - Delete the scratch script afterward:

        ```powershell
        Remove-Item .\agent-loop-smoke.ts
        ```
  12. Add optional focused manual checks.
      - Unknown tool:
        - Fake provider requests a tool name that is not registered.
        - Expected state includes a `toolResult` with `isError: true`.
        - Loop continues and lets the fake provider produce a final answer.
      - Tool throws:
        - Fake tool throws `new Error("boom")`.
        - Expected state includes a `toolResult` with `content: "boom"` and `isError: true`.
      - Max turns:
        - Fake provider always requests a tool.
        - Set `maxTurns: 1`.
        - Expected `runAgentLoop` throws `Agent loop reached max turns (1) before a final answer`.
  13. Run type checking.
      - From `ChatRealm/`, run:

        ```powershell
        npm run check
        ```

      - Fix all TypeScript errors before moving on.
      - Common fixes:
        - If imports fail, check `.js` import suffixes.
        - If `ToolCallContent` filtering fails, add the type guard from step 6.
        - If `ToolRegistry` import complains, use `import type`.
        - If `error.message` fails, remember the caught value is `unknown`.
  14. Keep TODO-010 intentionally small.
      - Do not add CLI output formatting.
      - Do not print assistant text from inside `runAgentLoop`.
      - Do not load API keys.
      - Do not construct the OpenAI transport here.
      - Do not persist sessions here.
      - Do not implement approvals.
      - Do not add streaming callbacks.
- Minimal expected `src/agent/agent-loop.ts` responsibilities:
  - Export `RunAgentLoopOptions`.
  - Export `RunAgentLoopResult`.
  - Export `runAgentLoop`.
  - Build `ChatRequest` from state and tool definitions.
  - Call `ChatTransport.complete`.
  - Append assistant messages.
  - Execute tool calls through `ToolRegistry`.
  - Append tool results.
  - Return the first assistant message that has no tool calls.
  - Throw on max-turn exhaustion.
- Beginner notes:
  - The loop should not know anything about OpenAI response JSON. `openai-compatible.ts` already converts provider responses into `AssistantMessage`.
  - The loop should not know how each tool validates arguments. Each tool owns its own argument parsing and validation.
  - The loop should not print output. Returning `finalMessage` keeps it reusable for CLI, tests, and future session persistence.
  - Appending the assistant message before tool results is important for chat completion APIs that require tool results to reference a previous assistant tool call.
  - A model can request multiple tools in one assistant message. Execute all of them in order and append one tool-result message per tool call.
- Acceptance criteria:
  - `src/agent/agent-loop.ts` exists.
  - `runAgentLoop` is exported.
  - The loop builds requests using `state.model`, `state.systemPrompt`, `state.messages`, and `tools.definitions()`.
  - The loop calls the transport until it receives an assistant message with no tool calls.
  - Assistant messages are appended to `AgentState`.
  - Tool calls are executed through `ToolRegistry`.
  - Tool results are appended with the original tool call id and tool name.
  - Unknown tool names become `isError: true` tool results.
  - Thrown tool errors become `isError: true` tool results.
  - Max-turn exhaustion throws a clear error.
  - No CLI wiring is added yet.
  - No config loading is added here.
  - No session persistence is added here.
  - No streaming renderer is added.
  - No `any` is used.
  - No dynamic imports are used.
  - `npm run check` succeeds from `ChatRealm/`.
- Reviewer checklist:
  - Confirm one turn maps to one provider call.
  - Confirm the loop cannot run forever.
  - Confirm tool results are visible to the next provider request.
  - Confirm unknown tool names do not crash the process.
  - Confirm provider-specific JSON shapes do not leak into `agent-loop.ts`.
  - Confirm the implementation remains small enough for TODO-011 to wire without refactoring.

### TODO-011: Wire Print Mode End To End

- Status: pending
- Goal: Replace the placeholder CLI behavior with a real print-mode run so `npm run dev -- -p "your task"` can load config, call the model, run tools through the agent loop, and print the final assistant answer.
- Scope:
  - Update `src/main.ts`.
  - Optionally create `src/agent/agent.ts` if you want a small wrapper around state creation and `runAgentLoop`.
  - Parse CLI args with `parseArgs`.
  - Print help and exit without loading config when `--help` or `-h` is used.
  - Require a prompt for normal execution.
  - Load config with `loadConfig`.
  - Merge CLI overrides with config values.
  - Create the OpenAI-compatible transport.
  - Create the default tool registry.
  - Create agent state.
  - Append the user prompt to state.
  - Run `runAgentLoop`.
  - Print only the final assistant text to stdout.
  - Keep errors simple for now; TODO-013 will improve user-facing error formatting.
  - Do not add session persistence yet.
  - Do not add streaming output yet.
  - Do not add TUI behavior.
- Likely files or areas: `src/main.ts`, `src/agent/agent.ts`
- Dependencies: TODO-002, TODO-003, TODO-005, TODO-010
- Reference from `pi`:
  - `pi` has multiple execution surfaces and a richer lifecycle.
  - ChatRealm should implement one path only:
    1. parse terminal input
    2. load configuration
    3. construct provider/tools/state
    4. run the loop
    5. print the final text
  - Do not copy `pi`'s TUI, session resume, RPC, provider registry, or event renderer.
- Beginner mental model:
  - TODO-010 made the engine.
  - TODO-011 connects the ignition switch.
  - `main.ts` is allowed to know about CLI args, config, provider construction, and process exit codes.
  - `agent-loop.ts` should stay reusable and should not learn about terminal output.
- Precedence rules:
  - Prompt:
    - Use `parsed.prompt`.
    - If no prompt exists and help was not requested, throw `Missing prompt`.
  - Model:
    - Use `parsed.model` first.
    - Otherwise use `config.model`.
    - Otherwise use a local MVP default model constant.
  - Provider:
    - Use `parsed.provider` first.
    - Otherwise default to `"openai-compatible"`.
    - If any other provider is requested, throw `Unsupported provider: <name>`.
  - Cwd:
    - Use `parsed.cwd` first.
    - Otherwise use `config.cwd`.
  - API key:
    - Use `config.apiKey`.
    - If missing, throw `Missing API key. Set CHATREALM_API_KEY or apiKey in chatrealm.config.json`.
  - Base URL:
    - Pass `config.baseUrl` to the OpenAI-compatible transport if present.
- Step-by-step implementation guide:
  1. Decide whether to add `src/agent/agent.ts`.
     - This file is optional.
     - If you add it, keep it small and focused on print-mode orchestration.
     - A reasonable exported function name is `runAgent`.
     - Suggested input shape:

       ```ts
       import type { ChatTransport } from "../ai/types.js";
       import type { ToolRegistry } from "../tools/registry.js";

       export interface RunAgentOptions {
         prompt: string;
         cwd: string;
         model: string;
         transport: ChatTransport;
         tools: ToolRegistry;
       }
       ```

     - The wrapper can:
       - create state
       - append the user prompt
       - call `runAgentLoop`
       - return the final message
     - If this wrapper feels unnecessary, put the orchestration directly in `main.ts` for now.
     - Do not create an `Agent` class unless there is real stateful behavior that needs it.
  2. Add imports to `src/main.ts`.
     - Replace placeholder imports with the real dependencies:

       ```ts
       import { appendUserMessage, createAgentState } from "./agent/state.js";
       import { buildDefaultSystemPrompt } from "./agent/prompt.js";
       import { runAgentLoop } from "./agent/agent-loop.js";
       import { createOpenAICompatibleTransport } from "./ai/openai-compatible.js";
       import type { AssistantMessage } from "./ai/types.js";
       import { getHelpText, parseArgs } from "./cli/args.js";
       import { loadConfig } from "./config/config.js";
       import { createDefaultToolRegistry } from "./tools/registry.js";
       ```

     - Adjust this list if you added `src/agent/agent.ts`.
     - Keep local import suffixes as `.js`.
     - Use top-level imports only.
  3. Add constants in `src/main.ts`.
     - Add a provider name constant:

       ```ts
       const OPENAI_COMPATIBLE_PROVIDER = "openai-compatible";
       ```

     - Add a local default model constant:

       ```ts
       const DEFAULT_MODEL = "gpt-4.1-mini";
       ```

     - The default model is only a learning-project fallback.
     - Users can override it through `--model`, `CHATREALM_MODEL`, or `chatrealm.config.json`.
  4. Create an async `main` function.
     - Recommended shape:

       ```ts
       async function main(): Promise<void> {
         const parsed = parseArgs(process.argv.slice(2));

         if (parsed.help) {
           console.log(getHelpText());
           return;
         }

         // Remaining setup goes here.
       }
       ```

     - Help should not load config, require an API key, call the model, or print JSON.
     - This fixes the current placeholder behavior where help still touches config/debug output.
  5. Validate the prompt.
     - After the help check:

       ```ts
       if (parsed.prompt === undefined) {
         throw new Error("Missing prompt");
       }
       ```

     - Do not silently use an empty prompt.
     - Do not ask interactively for a prompt in this TODO.
  6. Load config.
     - Add:

       ```ts
       const config = loadConfig();
       ```

     - Keep config loading in `main.ts` for now.
     - Do not load config from provider or agent-loop code.
  7. Resolve provider, model, cwd, and API key.
     - Recommended code:

       ```ts
       const provider = parsed.provider ?? OPENAI_COMPATIBLE_PROVIDER;

       if (provider !== OPENAI_COMPATIBLE_PROVIDER) {
         throw new Error(`Unsupported provider: ${provider}`);
       }

       const apiKey = config.apiKey;

       if (apiKey === undefined) {
         throw new Error(
           "Missing API key. Set CHATREALM_API_KEY or apiKey in chatrealm.config.json",
         );
       }

       const model = parsed.model ?? config.model ?? DEFAULT_MODEL;
       const cwd = parsed.cwd ?? config.cwd;
       ```

     - Keep this logic explicit.
     - Do not hide provider selection inside `createOpenAICompatibleTransport`.
  8. Create the runtime dependencies.
     - Recommended code:

       ```ts
       const transport = createOpenAICompatibleTransport({
         apiKey,
         baseUrl: config.baseUrl,
       });

       const tools = createDefaultToolRegistry();
       ```

     - This is the first point where the real provider and real tools are connected.
     - Do not add approvals yet.
  9. Create state and append the user prompt.
     - Recommended code:

       ```ts
       const state = createAgentState({
         cwd,
         model,
         systemPrompt: buildDefaultSystemPrompt(),
       });

       appendUserMessage(state, parsed.prompt);
       ```

     - Do not persist state in this TODO.
     - TODO-012 will decide how to save and load sessions.
  10. Run the agent loop.
      - Recommended code:

        ```ts
        const result = await runAgentLoop({
          state,
          transport,
          tools,
        });
        ```

      - If you created `runAgent` in `src/agent/agent.ts`, call that wrapper instead.
  11. Render the final assistant text.
      - Add a helper in `src/main.ts`:

        ```ts
        function renderAssistantText(message: AssistantMessage): string {
          return message.content
            .filter((content) => content.type === "text")
            .map((content) => content.text)
            .join("\n");
        }
        ```

      - If TypeScript does not narrow the filtered content, use a small type guard.
      - Print the rendered text:

        ```ts
        const text = renderAssistantText(result.finalMessage);

        if (text !== "") {
          console.log(text);
        }
        ```

      - Do not print the full JSON state during normal execution.
      - Do not print tool call internals unless you are temporarily debugging.
  12. Add top-level error handling.
      - Recommended shape:

        ```ts
        main().catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          console.error(message);
          process.exitCode = 1;
        });
        ```

      - Use `console.error` for errors.
      - Keep messages simple; TODO-013 will improve formatting.
  13. Manual checks without calling the real provider.
      - Run help:

        ```powershell
        npm run dev -- --help
        ```

      - Expected:
        - usage text is printed
        - no JSON debug output is printed
        - no API key is required
      - Run without prompt:

        ```powershell
        npm run dev
        ```

      - Expected:
        - exits with code 1
        - prints `Missing prompt`
      - Run with unsupported provider:

        ```powershell
        npm run dev -- -p "hi" --provider fake
        ```

      - Expected:
        - exits with code 1
        - prints `Unsupported provider: fake`
      - Run without API key:

        ```powershell
        npm run dev -- -p "hi"
        ```

      - Expected:
        - exits with code 1 if no API key is configured
        - prints the missing API key message
  14. Optional real-provider smoke check.
      - Only run this if you have a valid API key configured and are comfortable making a real model request.
      - Example:

        ```powershell
        $env:CHATREALM_API_KEY="..."
        npm run dev -- -p "Say exactly: ok"
        ```

      - Expected output:

        ```text
        ok
        ```

      - If the provider returns extra text, do not overfit the code to this prompt. This is only a smoke check.
  15. Run type checking.
      - From `ChatRealm/`, run:

        ```powershell
        npm run check
        ```

      - Fix all TypeScript errors before moving on.
      - Common fixes:
        - If top-level `await` causes confusion, use the `main().catch(...)` pattern.
        - If text filtering does not narrow, add a type guard.
        - If `parsed.prompt` is still possibly undefined after validation, store it in a local `const prompt = parsed.prompt` after the guard.
        - If `config.cwd` is undefined, re-check `AppConfig`; it should always contain `cwd`.
- Minimal expected `src/main.ts` behavior:
  - `--help` prints usage and exits successfully.
  - Missing prompt exits with an error.
  - Unsupported provider exits with an error.
  - Missing API key exits with an error.
  - Valid config creates an OpenAI-compatible transport.
  - Default tools are available to the agent loop.
  - The user prompt is appended before the loop starts.
  - The final assistant text is printed to stdout.
  - Debug JSON output is removed.
- Beginner notes:
  - `main.ts` is the composition root: it wires together pieces created in earlier TODOs.
  - Composition root code can be a little direct and boring; that is good for an MVP.
  - Keep provider-specific construction in `main.ts`, not inside `agent-loop.ts`.
  - Keep rendering in `main.ts`, not inside `agent-loop.ts`.
  - Do not add session IDs yet; TODO-012 will introduce that boundary.
- Acceptance criteria:
  - `src/main.ts` no longer prints parsed args JSON in normal execution.
  - Help output does not require config or API key.
  - A prompt is required for normal execution.
  - CLI `--model` overrides config model.
  - CLI `--provider` overrides default provider selection.
  - CLI `--cwd` overrides config cwd.
  - `CHATREALM_API_KEY` or config `apiKey` is required for OpenAI-compatible runs.
  - `createOpenAICompatibleTransport` is used.
  - `createDefaultToolRegistry` is used.
  - `createAgentState` and `appendUserMessage` are used.
  - `runAgentLoop` is called.
  - Only final assistant text is printed on success.
  - No session persistence is added.
  - No streaming output is added.
  - No TUI is added.
  - No `any` is used.
  - No dynamic imports are used.
  - `npm run check` succeeds from `ChatRealm/`.
- Reviewer checklist:
  - Confirm `main.ts` is the only place that reads process args and process env indirectly through config.
  - Confirm help mode exits before config/provider setup.
  - Confirm provider-specific setup does not leak into `agent-loop.ts`.
  - Confirm normal success output is human-readable text, not debug JSON.
  - Confirm TODO-012 remains responsible for session persistence.

### TODO-012: Add JSON Session Persistence

- Status: pending
- Goal: Persist conversation history to disk so later print-mode runs can continue from earlier messages instead of starting from an empty state every time.
- Scope:
  - Create `src/session/`.
  - Create `src/session/store.ts`.
  - Save session data as JSON under a local session directory.
  - Load previous session messages before appending the new user prompt.
  - Save updated session data after `runAgentLoop` completes.
  - Keep one default session for the MVP.
  - Keep run metadata fresh for each command invocation.
  - Do not persist API keys or provider credentials.
  - Do not add session branching.
  - Do not add compaction.
  - Do not add a session picker UI.
  - Do not add a database.
- Likely files or areas: `src/session/store.ts`, `src/agent/state.ts`, `src/main.ts`
- Dependencies: TODO-009, TODO-011
- Reference from `pi`:
  - `pi` has richer session concepts, compaction, lifecycle events, and resume behavior.
  - ChatRealm should not copy that yet.
  - The MVP lesson is only:
    1. serialize messages
    2. write JSON
    3. read JSON on next run
    4. continue the conversation
- Beginner mental model:
  - Session persistence is not the agent loop.
  - The loop still works with in-memory `AgentState`.
  - The session store only converts between disk JSON and the messages that state needs.
  - Each CLI run should create fresh run metadata, even when it loads old messages.
  - Old messages are conversation history. `run.turnCount` is current-process execution metadata.
- Storage decision for this MVP:
  - Use one default session file.
  - Recommended path:

    ```text
    <cwd>/.chatrealm/sessions/default.json
    ```

  - Resolve this path from the effective agent `cwd`, not from the repository root.
  - This keeps session data close to the project being worked on.
  - Add `.chatrealm/` to git ignore rules so local session data is not committed.
- JSON file shape:
  - Use a versioned object:

    ```ts
    interface SavedSession {
      version: 1;
      savedAt: string;
      messages: Message[];
    }
    ```

  - Store only JSON-safe values.
  - Do not store API keys.
  - Do not store transport objects, tool registries, functions, or errors.
- Step-by-step implementation guide:
  1. Create the session folder.
     - Create `src/session/`.
     - Create `src/session/store.ts`.
  2. Add imports to `src/session/store.ts`.
     - Recommended imports:

       ```ts
       import { mkdir, readFile, writeFile } from "node:fs/promises";
       import { dirname, resolve } from "node:path";

       import type { Message } from "../ai/types.js";
       import { parseJsonObject } from "../utils/json.js";
       ```

     - Use top-level imports only.
     - Use `fs/promises` because session reads and writes are I/O.
  3. Define saved session types.
     - Add:

       ```ts
       export interface SavedSession {
         version: 1;
         savedAt: string;
         messages: Message[];
       }

       export interface SessionStoreOptions {
         cwd: string;
         sessionName?: string;
       }
       ```

     - `sessionName` is optional so the MVP can use `"default"` now and still have a small extension point later.
     - Do not add CLI support for custom session names yet unless you intentionally update the parser too.
  4. Add path helpers.
     - Add:

       ```ts
       const DEFAULT_SESSION_NAME = "default";

       export function getSessionPath(options: SessionStoreOptions): string {
         const sessionName = options.sessionName ?? DEFAULT_SESSION_NAME;
         return resolve(options.cwd, ".chatrealm", "sessions", `${sessionName}.json`);
       }
       ```

     - For this MVP, keep session names simple and internal.
     - Do not accept arbitrary path-like session names from the user yet.
  5. Add `loadSessionMessages`.
     - Export a function:

       ```ts
       export async function loadSessionMessages(
         options: SessionStoreOptions,
       ): Promise<Message[]> {
         const sessionPath = getSessionPath(options);

         let text: string;

         try {
           text = await readFile(sessionPath, "utf8");
         } catch (error) {
           if (isNodeErrorWithCode(error, "ENOENT")) {
             return [];
           }

           throw error;
         }

         const json = parseJsonObject(text, sessionPath);
         const session = parseSavedSession(json, sessionPath);

         return session.messages;
       }
       ```

     - Missing session file should mean "no previous history".
     - Invalid JSON should throw; do not silently discard it.
  6. Add `saveSessionMessages`.
     - Export a function:

       ```ts
       export async function saveSessionMessages(
         options: SessionStoreOptions,
         messages: Message[],
       ): Promise<void> {
         const sessionPath = getSessionPath(options);
         const session: SavedSession = {
           version: 1,
           savedAt: new Date().toISOString(),
           messages,
         };

         await mkdir(dirname(sessionPath), { recursive: true });
         await writeFile(sessionPath, `${JSON.stringify(session, null, 2)}\n`, "utf8");
       }
       ```

     - Pretty JSON is acceptable for a learning project because it is inspectable.
     - Add a trailing newline.
  7. Add Node error helper.
     - Add:

       ```ts
       function isNodeErrorWithCode(error: unknown, code: string): boolean {
         return (
           error instanceof Error &&
           "code" in error &&
           (error as { code?: unknown }).code === code
         );
       }
       ```

     - Do not use `any`.
     - This helper is only for recognizing missing files.
  8. Add session JSON validation.
     - Add `parseSavedSession`.
     - Recommended shape:

       ```ts
       function parseSavedSession(
         value: Record<string, unknown>,
         sourceName: string,
       ): SavedSession {
         if (value.version !== 1) {
           throw new Error(`Unsupported session version in ${sourceName}`);
         }

         if (typeof value.savedAt !== "string") {
           throw new Error(`Expected savedAt string in ${sourceName}`);
         }

         if (!Array.isArray(value.messages)) {
           throw new Error(`Expected messages array in ${sourceName}`);
         }

         return {
           version: 1,
           savedAt: value.savedAt,
           messages: value.messages.map((message, index) =>
             parseMessage(message, `${sourceName} messages[${index}]`),
           ),
         };
       }
       ```

     - Do not return `value as SavedSession` without checking it.
  9. Add message validation.
     - First expand the type imports in `src/session/store.ts`.
     - Recommended type imports:

       ```ts
       import type {
         AssistantMessage,
         Message,
         ToolResultMessage,
         UserMessage,
       } from "../ai/types.js";
       ```

     - Add a reusable object guard:

       ```ts
       function isRecord(value: unknown): value is Record<string, unknown> {
         return typeof value === "object" && value !== null && !Array.isArray(value);
       }
       ```

     - Add `parseMessage`.
     - This function should:
       - reject non-objects
       - inspect `role`
       - delegate to a role-specific parser
       - include `sourceName` in every error message
     - Recommended shape:

       ```ts
       function parseMessage(value: unknown, sourceName: string): Message {
         if (!isRecord(value)) {
           throw new Error(`Expected message object in ${sourceName}`);
         }

         switch (value.role) {
           case "user":
             return parseUserMessage(value, sourceName);
           case "assistant":
             return parseAssistantMessage(value, sourceName);
           case "toolResult":
             return parseToolResultMessage(value, sourceName);
           default:
             throw new Error(`Expected valid message role in ${sourceName}`);
         }
       }
       ```

     - Add `parseUserMessage`.
     - Recommended shape:

       ```ts
       function parseUserMessage(
         value: Record<string, unknown>,
         sourceName: string,
       ): UserMessage {
         if (typeof value.content !== "string") {
           throw new Error(`Expected user content string in ${sourceName}`);
         }

         return {
           role: "user",
           content: value.content,
         };
       }
       ```

     - Add `parseToolResultMessage`.
     - Recommended shape:

       ```ts
       function parseToolResultMessage(
         value: Record<string, unknown>,
         sourceName: string,
       ): ToolResultMessage {
         if (typeof value.toolCallId !== "string") {
           throw new Error(`Expected toolCallId string in ${sourceName}`);
         }

         if (typeof value.toolName !== "string") {
           throw new Error(`Expected toolName string in ${sourceName}`);
         }

         if (typeof value.content !== "string") {
           throw new Error(`Expected tool result content string in ${sourceName}`);
         }

         if (typeof value.isError !== "boolean") {
           throw new Error(`Expected isError boolean in ${sourceName}`);
         }

         return {
           role: "toolResult",
           toolCallId: value.toolCallId,
           toolName: value.toolName,
           content: value.content,
           isError: value.isError,
         };
       }
       ```

     - Add `parseAssistantMessage`.
     - Recommended shape:

       ```ts
       function parseAssistantMessage(
         value: Record<string, unknown>,
         sourceName: string,
       ): AssistantMessage {
         if (!Array.isArray(value.content)) {
           throw new Error(`Expected assistant content array in ${sourceName}`);
         }

         if (typeof value.model !== "string") {
           throw new Error(`Expected assistant model string in ${sourceName}`);
         }

         return {
           role: "assistant",
           content: value.content.map((content, index) =>
             parseAssistantContent(content, `${sourceName}.content[${index}]`),
           ),
           model: value.model,
           usage: parseUsage(value.usage, `${sourceName}.usage`),
           stopReason: parseStopReason(value.stopReason, `${sourceName}.stopReason`),
           errorMessage: parseOptionalString(
             value.errorMessage,
             `${sourceName}.errorMessage`,
           ),
         };
       }
       ```

     - Keep this validation focused.
     - Do not preserve unknown extra fields from the JSON file.
     - Reconstruct clean message objects instead of mutating or trusting loaded objects.
     - It is acceptable to be stricter than production for the MVP.
  10. Add assistant content validation.
      - Expand type imports again if needed:

        ```ts
        import type {
          AssistantContent,
          JsonObject,
          JsonValue,
          TextContent,
          ToolCallContent,
        } from "../ai/types.js";
        ```

      - Add `parseAssistantContent`.
      - Recommended shape:

        ```ts
        function parseAssistantContent(
          value: unknown,
          sourceName: string,
        ): AssistantContent {
          if (!isRecord(value)) {
            throw new Error(`Expected assistant content object in ${sourceName}`);
          }

          switch (value.type) {
            case "text":
              return parseTextContent(value, sourceName);
            case "toolCall":
              return parseToolCallContent(value, sourceName);
            default:
              throw new Error(`Expected valid assistant content type in ${sourceName}`);
          }
        }
        ```

      - Add `parseTextContent`.
      - Recommended shape:

        ```ts
        function parseTextContent(
          value: Record<string, unknown>,
          sourceName: string,
        ): TextContent {
          if (typeof value.text !== "string") {
            throw new Error(`Expected text content string in ${sourceName}`);
          }

          return {
            type: "text",
            text: value.text,
          };
        }
        ```

      - Add `parseToolCallContent`.
      - Recommended shape:

        ```ts
        function parseToolCallContent(
          value: Record<string, unknown>,
          sourceName: string,
        ): ToolCallContent {
          if (typeof value.id !== "string") {
            throw new Error(`Expected tool call id string in ${sourceName}`);
          }

          if (typeof value.name !== "string") {
            throw new Error(`Expected tool call name string in ${sourceName}`);
          }

          return {
            type: "toolCall",
            id: value.id,
            name: value.name,
            arguments: parseJsonObjectValue(
              value.arguments,
              `${sourceName}.arguments`,
            ),
          };
        }
        ```

      - Add JSON value validation for tool-call arguments.
      - `ToolCallContent.arguments` must be a `JsonObject`, not an arbitrary JavaScript object.
      - Recommended helpers:

        ```ts
        function parseJsonObjectValue(
          value: unknown,
          sourceName: string,
        ): JsonObject {
          if (!isRecord(value)) {
            throw new Error(`Expected JSON object in ${sourceName}`);
          }

          const result: JsonObject = {};

          for (const [key, item] of Object.entries(value)) {
            result[key] = parseJsonValue(item, `${sourceName}.${key}`);
          }

          return result;
        }

        function parseJsonValue(value: unknown, sourceName: string): JsonValue {
          if (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean" ||
            value === null
          ) {
            return value;
          }

          if (Array.isArray(value)) {
            return value.map((item, index) =>
              parseJsonValue(item, `${sourceName}[${index}]`),
            );
          }

          if (isRecord(value)) {
            return parseJsonObjectValue(value, sourceName);
          }

          throw new Error(`Expected JSON value in ${sourceName}`);
        }
        ```

      - Do not use `any`.
      - Do not accept functions, `undefined`, dates, class instances, or other non-JSON values.
  11. Add usage validation.
      - Expand type imports if needed:

        ```ts
        import type { StopReason, Usage } from "../ai/types.js";
        ```

      - Add `parseUsage`.
      - Recommended shape:

        ```ts
        function parseUsage(value: unknown, sourceName: string): Usage | undefined {
          if (value === undefined) {
            return undefined;
          }

          if (!isRecord(value)) {
            throw new Error(`Expected usage object in ${sourceName}`);
          }

          return {
            inputTokens: parseNumber(value.inputTokens, `${sourceName}.inputTokens`),
            outputTokens: parseNumber(value.outputTokens, `${sourceName}.outputTokens`),
            totalTokens: parseNumber(value.totalTokens, `${sourceName}.totalTokens`),
          };
        }
        ```

      - Add `parseNumber`.
      - Recommended shape:

        ```ts
        function parseNumber(value: unknown, sourceName: string): number {
          if (typeof value !== "number") {
            throw new Error(`Expected number in ${sourceName}`);
          }

          return value;
        }
        ```

      - Add `parseStopReason`.
      - Recommended shape:

        ```ts
        function parseStopReason(value: unknown, sourceName: string): StopReason {
          if (
            value === "stop" ||
            value === "length" ||
            value === "toolUse" ||
            value === "error"
          ) {
            return value;
          }

          throw new Error(`Expected valid stopReason in ${sourceName}`);
        }
        ```

      - Add `parseOptionalString`.
      - Recommended shape:

        ```ts
        function parseOptionalString(
          value: unknown,
          sourceName: string,
        ): string | undefined {
          if (value === undefined) {
            return undefined;
          }

          if (typeof value !== "string") {
            throw new Error(`Expected optional string in ${sourceName}`);
          }

          return value;
        }
        ```

      - Keep `usage` optional because some providers may not return token counts.
      - Keep `errorMessage` optional because normal assistant messages do not have one.
      - Do not default missing usage numbers to `0` when loading a session; either the whole `usage` object is absent, or all three numbers must be valid.
  12. Add `.chatrealm/` to ignore rules.
      - If `ChatRealm/.gitignore` exists, add:

        ```text
        .chatrealm/
        ```

      - If there is no `ChatRealm/.gitignore`, add `.chatrealm/` to the repository `.gitignore`.
      - This prevents local session files from being committed.
  13. Wire loading into `src/main.ts`.
      - Import:

        ```ts
        import { loadSessionMessages, saveSessionMessages } from "./session/store.js";
        ```

      - After creating state and before appending the new prompt:

        ```ts
        state.messages.push(...await loadSessionMessages({ cwd }));
        appendUserMessage(state, parsed.prompt);
        ```

      - This keeps run metadata fresh because `createAgentState` still creates a new run.
      - It preserves conversation history because old messages are added before the new user message.
  14. Wire saving into `src/main.ts`.
      - After `runAgentLoop` resolves successfully, save the updated messages:

        ```ts
        await saveSessionMessages({ cwd }, result.state.messages);
        ```

      - Save before printing or after printing; either is acceptable.
      - Prefer saving before printing if you want the command to fail visibly when persistence fails.
      - Do not save if `runAgentLoop` throws; TODO-013 can decide whether partial failed sessions should be saved.
  15. Think through first-run behavior.
      - If no session file exists:
        - `loadSessionMessages` returns `[]`.
        - The new user prompt is appended.
        - The agent runs normally.
        - A new `.chatrealm/sessions/default.json` file is written.
      - If a session file exists:
        - Previous messages load first.
        - The new user prompt is appended after them.
        - The model sees the prior conversation.
        - The updated file replaces the old JSON.
  16. Manual smoke check without a real provider.
      - You can test `store.ts` directly with a temporary script.
      - Create `session-store-smoke.ts` in `ChatRealm/`.
      - Do not commit it.
      - Example:

        ```ts
        import { mkdtemp, rm } from "node:fs/promises";
        import { join } from "node:path";
        import { tmpdir } from "node:os";
        import {
          getSessionPath,
          loadSessionMessages,
          saveSessionMessages,
        } from "./src/session/store.js";

        const cwd = await mkdtemp(join(tmpdir(), "chatrealm-session-"));

        try {
          const initial = await loadSessionMessages({ cwd });

          if (initial.length !== 0) {
            throw new Error("Expected empty initial session");
          }

          await saveSessionMessages(
            { cwd },
            [
              {
                role: "user",
                content: "hello",
              },
            ],
          );

          const loaded = await loadSessionMessages({ cwd });

          if (loaded.length !== 1 || loaded[0]?.role !== "user") {
            throw new Error("Expected saved user message");
          }

          if (!getSessionPath({ cwd }).endsWith(".chatrealm/sessions/default.json")) {
            throw new Error("Unexpected session path");
          }

          console.log("todo-012 smoke ok");
        } finally {
          await rm(cwd, { recursive: true, force: true });
        }
        ```

      - Run it from `ChatRealm/`:

        ```powershell
        npm exec tsx -- ./session-store-smoke.ts
        ```

      - Expected output:

        ```text
        todo-012 smoke ok
        ```

      - Delete the scratch script afterward:

        ```powershell
        Remove-Item .\session-store-smoke.ts
        ```
  17. Manual CLI check.
      - Run one real or fake-provider command that succeeds.
      - Confirm this file exists:

        ```text
        <cwd>/.chatrealm/sessions/default.json
        ```

      - Open it and confirm it contains:
        - `version`
        - `savedAt`
        - `messages`
      - Run a second prompt and confirm the file now contains both runs' messages.
  18. Run type checking.
      - From `ChatRealm/`, run:

        ```powershell
        npm run check
        ```

      - Fix all TypeScript errors before moving on.
- Beginner notes:
  - Do not store `AgentState.run` as durable history. It is per-run metadata.
  - Persisting only messages keeps follow-up behavior simple.
  - JSON files are external input after they exist on disk, so validate them on load.
  - Pretty JSON is easier to inspect while learning.
  - The session file is local workspace state, not source code.
- Acceptance criteria:
  - `src/session/store.ts` exists.
  - Session data is saved under `.chatrealm/sessions/default.json` relative to effective `cwd`.
  - Missing session file loads as empty history.
  - Invalid session JSON throws a clear error.
  - Loaded messages are appended to new `AgentState` before the new user prompt.
  - Run metadata is fresh for each CLI invocation.
  - Updated messages are saved after a successful agent loop.
  - `.chatrealm/` is ignored by git.
  - No API keys or provider credentials are persisted.
  - No database is added.
  - No session UI is added.
  - No compaction is added.
  - No `any` is used.
  - No dynamic imports are used.
  - `npm run check` succeeds from `ChatRealm/`.
- Reviewer checklist:
  - Confirm persistence code is isolated in `src/session/store.ts`.
  - Confirm `agent-loop.ts` does not read or write disk.
  - Confirm session loading does not reuse stale `turnCount`.
  - Confirm session files are not committed.
  - Confirm corrupt session JSON fails loudly instead of being silently overwritten.

### TODO-013: Add Error Handling And User-Facing Output

- Status: pending
- Goal: Replace raw thrown errors with a small, predictable error formatting layer so terminal users see short, useful messages and the program exits with the right code.
- Scope:
  - Add a reusable error utility module in `src/utils/errors.ts`.
  - Classify common failures into a small set of user-facing categories.
  - Update `src/main.ts` so CLI usage/config/provider/session errors print consistently.
  - Keep tool execution errors as tool-result messages inside the agent loop, but make their text concise.
  - Keep the implementation small; do not add logging frameworks, retry logic, telemetry, or rich diagnostics yet.
- Out of scope:
  - Do not add tests yet; TODO-014 owns formal test files.
  - Do not add streaming output.
  - Do not add a TUI renderer.
  - Do not save failed partial sessions unless the agent loop completed successfully.
  - Do not add provider-specific recovery or automatic retries.
- Likely files or areas: `src/utils/errors.ts`, `src/main.ts`, `src/agent/agent-loop.ts`, optional `src/session/store.ts`
- Dependencies: TODO-011, TODO-012
- Beginner mental model:
  - Throwing an `Error` stops normal execution and jumps to the nearest `catch`.
  - `main().catch(...)` is the final safety net for the CLI.
  - The user should not see stack traces during normal expected failures such as missing prompt or missing API key.
  - The developer still wants clear internal code, so classify errors once and format them in one place.
  - Tool failures are different from CLI failures: a failed tool call should usually be returned to the model as a `toolResult`, not crash the whole program.
- Error categories for this MVP:
  - `usage`: the user ran the command incorrectly, for example missing prompt or unknown option.
  - `config`: required local configuration is missing or invalid, for example missing API key.
  - `provider`: the model API request failed or returned an invalid response.
  - `session`: session JSON could not be loaded or validated.
  - `agent`: the agent loop failed, for example max turns were exhausted.
  - `tool`: a local tool failed while the model was using it.
  - `unknown`: a non-Error value or unexpected failure reached the CLI boundary.
- Suggested output style:
  - Keep messages to one line for expected failures.
  - Prefix messages with a short label:

    ```text
    Usage error: Missing prompt
    Config error: Missing API key. Set CHATREALM_API_KEY or apiKey in chatrealm.config.json
    Provider error: OpenAI-compatible request failed with 401
    Session error: Invalid JSON in C:/project/.chatrealm/sessions/default.json
    Agent error: Agent loop reached max turns (10) before a final answer
    ```

  - Do not print stack traces by default.
  - Keep the underlying `Error` object available as `cause` when wrapping errors.
- Step-by-step implementation guide:
  1. Create `src/utils/errors.ts`.
     - This file should contain generic error helpers only.
     - Do not import agent, provider, CLI, or session modules here.
     - Think of this file as a small shared vocabulary for failures.
  2. Define the category type.
     - Add:

       ```ts
       export type UserFacingErrorCategory =
         | "usage"
         | "config"
         | "provider"
         | "session"
         | "agent"
         | "tool"
         | "unknown";
       ```

     - This is a TypeScript union type.
     - It means only those exact strings are allowed.
     - If you mistype `"confg"`, TypeScript will catch it.
  3. Define a formatted CLI result type.
     - Add:

       ```ts
       export interface FormattedCliError {
         message: string;
         exitCode: number;
       }
       ```

     - `message` is what `main.ts` prints to `stderr`.
     - `exitCode` is what `process.exitCode` should become.
     - For this MVP, use exit code `1` for all failures except help, which already exits successfully.
  4. Add a `UserFacingError` class.
     - Use explicit fields, not TypeScript parameter properties.
     - Recommended shape:

       ```ts
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
       ```

     - Why this class exists:
       - It lets code say "this is safe to show to the user".
       - It carries the category and exit code beside the message.
       - It still behaves like a normal JavaScript `Error`.
     - What not to do:
       - Do not use `any`.
       - Do not use constructor parameter properties such as `constructor(readonly category: ...)`.
       - Do not put `console.error` inside this class.
  5. Add a category label helper.
     - Add:

       ```ts
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
       ```

     - A `switch` is clearer than a map for beginners.
     - Because the union type is small, this is easy to maintain.
  6. Add `formatCliError`.
     - Add:

       ```ts
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
       ```

     - This function accepts `unknown` because JavaScript can throw anything.
     - It returns a simple object so `main.ts` does not need to know formatting rules.
  7. Add a small wrapping helper.
     - Add:

       ```ts
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
       ```

     - This is useful around provider/session calls.
     - Keep it simple. Do not try to inspect every possible provider error shape yet.
  8. Update imports in `src/main.ts`.
     - Add:

       ```ts
       import {
         UserFacingError,
         formatCliError,
         toUserFacingError,
       } from "./utils/errors";
       ```

     - Use the no-extension import style currently used by ChatRealm.
  9. Update the top-level catch in `src/main.ts`.
     - Replace the current catch body with:

       ```ts
       main().catch((error: unknown) => {
         const formatted = formatCliError(error);
         console.error(formatted.message);
         process.exitCode = formatted.exitCode;
       });
       ```

     - Why this belongs in `main.ts`:
       - `main.ts` is the process boundary.
       - Only `main.ts` should decide what reaches the terminal.
       - Lower-level modules should throw useful errors, not print directly.
  10. Convert expected CLI/config errors to `UserFacingError`.
      - Missing prompt should become:

        ```ts
        throw new UserFacingError("usage", "Missing prompt");
        ```

      - Unsupported provider should become:

        ```ts
        throw new UserFacingError("usage", `Unsupported provider: ${provider}`);
        ```

      - Missing API key should become:

        ```ts
        throw new UserFacingError(
          "config",
          "Missing API key. Set CHATREALM_API_KEY or apiKey in chatrealm.config.json",
        );
        ```

      - These are expected user-correctable failures, so they should not print as `Unexpected error`.
  11. Wrap session loading.
      - `loadSessionMessages` can fail because JSON is corrupt or has the wrong shape.
      - In `main.ts`, wrap only the load call:

        ```ts
        let savedMessages;

        try {
          savedMessages = await loadSessionMessages({ cwd });
        } catch (error) {
          throw toUserFacingError("session", error, "Failed to load session");
        }

        state.messages.push(...savedMessages);
        ```

      - TypeScript can infer the variable if you initialize it carefully.
      - If inference is confusing, import `Message` as a type and write:

        ```ts
        let savedMessages: Message[] = [];
        ```

      - Do not catch all of `main()` at this point; only wrap the operation you want to classify.
  12. Wrap the provider/agent loop boundary.
      - `runAgentLoop` can fail because:
        - the provider request failed
        - the provider response was invalid
        - max turns were exhausted
      - Keep the MVP simple:
        - if the error message starts with `Agent loop reached max turns`, classify it as `agent`
        - otherwise classify it as `provider`
      - Suggested shape:

        ```ts
        let result;

        try {
          result = await runAgentLoop({
            state,
            transport,
            tools,
          });
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.startsWith("Agent loop reached max turns")
          ) {
            throw toUserFacingError("agent", error, "Agent loop failed");
          }

          throw toUserFacingError("provider", error, "Provider request failed");
        }
        ```

      - This is not perfect, but it is enough for the MVP.
      - Do not add custom provider error classes yet unless you already need them.
  13. Wrap session saving.
      - If saving fails after the model completed, tell the user clearly:

        ```ts
        try {
          await saveSessionMessages({ cwd }, result.state.messages);
        } catch (error) {
          throw toUserFacingError("session", error, "Failed to save session");
        }
        ```

      - This means a successful model response may not print if saving fails.
      - That is acceptable for the MVP because persistence is part of the command contract after TODO-012.
  14. Keep tool errors inside `agent-loop.ts`.
      - `executeToolCall` already catches tool failures and appends a `toolResult`.
      - Improve only the formatting helper if needed.
      - Good MVP output for a thrown tool error:

        ```text
        Tool error: <message>
        ```

      - Suggested helper:

        ```ts
        function formatToolExecutionError(error: unknown): string {
          if (error instanceof Error) {
            return `Tool error: ${error.message}`;
          }

          return `Tool error: ${String(error)}`;
        }
        ```

      - Do not throw from `executeToolCall` for normal tool failures.
      - The model needs to see the tool error so it can recover or explain it.
  15. Manual check: help still succeeds.
      - From `ChatRealm/`, run:

        ```powershell
        npm run dev -- --help
        ```

      - Expected:
        - usage text prints to stdout
        - process exits successfully
        - no `Usage error:` prefix appears
  16. Manual check: missing prompt.
      - Run:

        ```powershell
        npm run dev
        ```

      - Expected stderr:

        ```text
        Usage error: Missing prompt
        ```

      - Expected exit code: `1`.
  17. Manual check: unsupported provider.
      - Run:

        ```powershell
        npm run dev -- -p "hi" --provider fake
        ```

      - Expected stderr:

        ```text
        Usage error: Unsupported provider: fake
        ```
  18. Manual check: missing API key.
      - Run this only if you do not have `CHATREALM_API_KEY` set and your config file does not contain `apiKey`:

        ```powershell
        npm run dev -- -p "hi"
        ```

      - Expected stderr:

        ```text
        Config error: Missing API key. Set CHATREALM_API_KEY or apiKey in chatrealm.config.json
        ```

      - If you do have an API key configured, temporarily run in a clean temp directory or set `CHATREALM_CONFIG` to a missing temp file for this check.
  19. Manual check: corrupt session JSON.
      - Create a temporary directory outside the project.
      - Inside it, create `.chatrealm/sessions/default.json` with invalid JSON, for example:

        ```json
        {
        ```

      - Run ChatRealm with `--cwd` pointing at that temp directory and with a fake or real API key value:

        ```powershell
        npm run dev -- -p "hi" --cwd "C:\path\to\temp"
        ```

      - Expected stderr starts with:

        ```text
        Session error:
        ```

      - Clean up the temp directory after the check.
  20. Optional real-provider check.
      - Only run this if you have a valid API key and accept making one model request:

        ```powershell
        npm run dev -- -p "Say exactly: ok"
        ```

      - Expected:
        - normal assistant output prints to stdout
        - no error prefix appears
        - session file is still saved after success
  21. Run type checking.
      - From `ChatRealm/`, run:

        ```powershell
        npm run check
        ```

      - From the repository root, also run:

        ```powershell
        npm run check
        ```

      - Fix all errors before moving on.
- Minimal expected file contents:
  - `src/utils/errors.ts` exports `UserFacingError`, `formatCliError`, and `toUserFacingError`.
  - `src/main.ts` formats all top-level errors through `formatCliError`.
  - `src/main.ts` throws `UserFacingError` for expected usage/config failures.
  - `src/main.ts` wraps session load/save failures as `session`.
  - `src/main.ts` wraps provider or loop failures as `provider` or `agent`.
  - `src/agent/agent-loop.ts` keeps tool failures inside `toolResult` messages.
- Acceptance criteria:
  - `--help` still prints help and exits successfully.
  - Missing prompt prints `Usage error: Missing prompt`.
  - Unsupported provider prints `Usage error: Unsupported provider: <name>`.
  - Missing API key prints `Config error: ...`.
  - Corrupt session JSON prints a `Session error: ...` message instead of silently overwriting the file.
  - Max-turn exhaustion prints an `Agent error: ...` message.
  - Provider request failures print a `Provider error: ...` message.
  - Tool execution failures are returned as tool-result content and do not crash the process by themselves.
  - No stack trace is printed for expected failures.
  - No `any` is used.
  - No dynamic imports are used.
  - `npm run check` succeeds from `ChatRealm/`.
  - Root `npm run check` succeeds from the repository root.
- Reviewer checklist:
  - Confirm `src/utils/errors.ts` does not import application modules.
  - Confirm `main.ts` is the only place that prints top-level errors.
  - Confirm expected user mistakes are not labeled as unknown errors.
  - Confirm session corruption fails loudly and does not overwrite the corrupt file.
  - Confirm the agent loop still returns tool errors to the model.
  - Confirm no new retry, logging, telemetry, or TUI behavior was added.

### TODO-014: Add Focused MVP Tests

- Status: completed
- Scope: Cover CLI parsing, registry lookup, fake-provider agent loop, max-turn handling, and tool error propagation.
- Completion notes:
  - Added focused Node test runner coverage for CLI parsing, registry behavior, fake-provider agent loop behavior, max-turn exhaustion, and tool execution error propagation.
  - Added a `test:unit` script and included test files in TypeScript checking.
  - Normalized the session store smoke import so the root relative-import check passes.
  - Verification passed: `npm run test:unit` from `ChatRealm/`, `npm run check` from `ChatRealm/`, and `npm run check` from the repository root.
- Likely files or areas: [ChatRealm/test/cli-args.test.ts](../ChatRealm/test/cli-args.test.ts), [ChatRealm/test/tool-registry.test.ts](../ChatRealm/test/tool-registry.test.ts), [ChatRealm/test/agent-loop.test.ts](../ChatRealm/test/agent-loop.test.ts), [ChatRealm/package.json](../ChatRealm/package.json), [ChatRealm/tsconfig.json](../ChatRealm/tsconfig.json), [ChatRealm/session-store-smoke.ts](../ChatRealm/session-store-smoke.ts)
- Dependencies: TODO-002, TODO-006, TODO-010, TODO-013

### TODO-015: Write MVP Usage Documentation

- Status: completed
- Scope: Document setup, environment variables, example commands, current limitations, and the next architecture milestones.
- Completion notes:
  - Added MVP usage documentation covering setup, configuration sources, environment variables, example commands, local tools, session persistence, current limitations, and next architecture milestones.
  - This was a documentation-only change; no code verification command was required for this TODO.
- Likely files or areas: [ChatRealm/README.md](../ChatRealm/README.md)
- Dependencies: TODO-011, TODO-014

## Dependencies Between TODO Items

- TODO-001 must be first.
- TODO-002 and TODO-003 prepare executable configuration.
- TODO-004 and TODO-005 create the AI boundary.
- TODO-006 through TODO-008 create the tool boundary.
- TODO-009 and TODO-010 create the core agent behavior.
- TODO-011 produces the first usable MVP.
- TODO-012 through TODO-015 harden and document the MVP.

## Next Executable Item

- None. The MVP TODO plan has no remaining planned item.

## Assumptions

- The MVP is being built as the separate `ChatRealm` learning project under the current workspace.
- TypeScript is the preferred stack because `pi` is TypeScript-based and the architecture lessons transfer directly.
- The first usable agent should prioritize print mode over TUI because it exposes the real agent loop with much less UI complexity.
- Tool execution should be local and explicit; remote sandboxes, approval systems, and plugin loading are deferred.

## Risks

- Tool-call response formats differ across providers; the MVP should start with one OpenAI-compatible API.
- Shell and write-file tools can be unsafe if exposed too early; path confinement and clear command output should be implemented before broad use.
- A full TUI can distract from learning the agent architecture; it should wait until the core loop is understood.
