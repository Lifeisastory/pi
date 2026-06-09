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
