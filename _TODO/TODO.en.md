# MVP Agent Implementation Plan

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
- Scope: Define provider-neutral message, tool, tool call, response, usage, and streaming-ready interfaces.
- Likely files or areas: `src/ai/types.ts`
- Dependencies: TODO-001

### TODO-005: Implement OpenAI-Compatible Provider

- Status: pending
- Scope: Implement one provider adapter that sends chat requests and returns assistant messages with optional tool calls.
- Likely files or areas: `src/ai/openai-compatible.ts`, `src/config/config.ts`
- Dependencies: TODO-003, TODO-004

### TODO-006: Define Tool Contracts And Registry

- Status: pending
- Scope: Create the internal tool interface, JSON schema metadata, validation boundary, and registry lookup.
- Likely files or areas: `src/tools/types.ts`, `src/tools/registry.ts`, `test/tool-registry.test.ts`
- Dependencies: TODO-004

### TODO-007: Implement Read And Search Tools

- Status: pending
- Scope: Add read-file and search tools with path normalization, cwd confinement, clear errors, and concise output.
- Likely files or areas: `src/tools/read-file.ts`, `src/tools/search.ts`, `src/tools/registry.ts`
- Dependencies: TODO-006

### TODO-008: Implement Write And Shell Tools

- Status: pending
- Scope: Add write-file and shell command tools with explicit safety boundaries and result objects.
- Likely files or areas: `src/tools/write-file.ts`, `src/tools/shell.ts`, `src/tools/registry.ts`
- Dependencies: TODO-006, TODO-007

### TODO-009: Build Minimal Agent State

- Status: pending
- Scope: Store messages, tool results, current cwd, selected model, and run metadata in memory.
- Likely files or areas: `src/agent/state.ts`, `src/agent/prompt.ts`
- Dependencies: TODO-004, TODO-006

### TODO-010: Implement Agent Loop

- Status: pending
- Scope: Run the prompt, call the model, execute requested tools, append tool results, and continue until a final assistant answer or max turns.
- Likely files or areas: `src/agent/agent-loop.ts`, `src/agent/agent.ts`, `test/agent-loop.test.ts`
- Dependencies: TODO-005, TODO-006, TODO-009

### TODO-011: Wire Print Mode End To End

- Status: pending
- Scope: Connect CLI args, config, provider, tool registry, and agent loop so one command can complete a task.
- Likely files or areas: `src/main.ts`, `src/agent/agent.ts`
- Dependencies: TODO-002, TODO-003, TODO-005, TODO-010

### TODO-012: Add JSON Session Persistence

- Status: pending
- Scope: Save and load conversation state under a local session directory for follow-up runs.
- Likely files or areas: `src/session/store.ts`, `src/agent/state.ts`, `src/main.ts`
- Dependencies: TODO-009, TODO-011

### TODO-013: Add Error Handling And User-Facing Output

- Status: pending
- Scope: Normalize provider errors, tool errors, JSON parse errors, and CLI usage errors into concise terminal output.
- Likely files or areas: `src/utils/errors.ts`, `src/main.ts`, `src/agent/agent-loop.ts`
- Dependencies: TODO-011

### TODO-014: Add Focused MVP Tests

- Status: pending
- Scope: Cover CLI parsing, registry lookup, fake-provider agent loop, max-turn handling, and tool error propagation.
- Likely files or areas: `test/cli-args.test.ts`, `test/tool-registry.test.ts`, `test/agent-loop.test.ts`
- Dependencies: TODO-002, TODO-006, TODO-010, TODO-013

### TODO-015: Write MVP Usage Documentation

- Status: pending
- Scope: Document setup, environment variables, example commands, current limitations, and the next architecture milestones.
- Likely files or areas: `README.md`
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

- TODO-003: Add Configuration Loading

## Assumptions

- The MVP is being built as the separate `ChatRealm` learning project under the current workspace.
- TypeScript is the preferred stack because `pi` is TypeScript-based and the architecture lessons transfer directly.
- The first usable agent should prioritize print mode over TUI because it exposes the real agent loop with much less UI complexity.
- Tool execution should be local and explicit; remote sandboxes, approval systems, and plugin loading are deferred.

## Risks

- Tool-call response formats differ across providers; the MVP should start with one OpenAI-compatible API.
- Shell and write-file tools can be unsafe if exposed too early; path confinement and clear command output should be implemented before broad use.
- A full TUI can distract from learning the agent architecture; it should wait until the core loop is understood.
