# ChatRealm

ChatRealm is a minimal TypeScript coding-agent MVP inspired by the `pi` architecture. It runs in print mode from a terminal, sends one prompt to an OpenAI-compatible chat completions provider, lets the model call a small local tool set, saves conversation history as JSON, and prints the final assistant text.

This project is a learning implementation, not a production agent.

## Setup

Install dependencies from the ChatRealm directory:

```powershell
cd ChatRealm
npm install --ignore-scripts
```

Expose the local terminal command:

```powershell
npm link --ignore-scripts
```

After linking, run ChatRealm directly:

```powershell
chatrealm --help
```

Check TypeScript:

```powershell
npm run check
```

Run the focused MVP tests:

```powershell
npm run test:unit
```

## Configuration

ChatRealm reads configuration from environment variables and an optional JSON config file.

Default config file:

```text
chatrealm.config.json
```

Custom config file path:

```powershell
$env:CHATREALM_CONFIG = "C:\path\to\chatrealm.config.json"
```

Supported environment variables:

```text
CHATREALM_API_KEY   Required unless apiKey is set in the config file.
CHATREALM_BASE_URL  Optional OpenAI-compatible base URL.
CHATREALM_MODEL     Optional model override.
CHATREALM_CWD       Optional agent working directory.
```

Supported JSON config keys:

```json
{
  "apiKey": "your-api-key",
  "baseUrl": "https://api.openai.com/v1",
  "model": "gpt-4.1-mini",
  "cwd": "D:/path/to/workspace"
}
```

Precedence:

1. CLI flags override runtime defaults where a flag exists.
2. Environment variables override JSON config values.
3. JSON config values override built-in defaults.
4. `cwd` defaults to the current process directory.
5. `model` defaults to `gpt-4.1-mini`.

The only supported provider name is `openai-compatible`.

## Commands

Show help:

```powershell
chatrealm --help
```

Enter interactive mode:

```powershell
chatrealm
```

Assistant text streams to the terminal in interactive mode. Tool calls are still collected as complete model messages before execution.

Interactive mode supports these slash commands:

```text
/help
/exit
/quit
```

Run with an explicit prompt:

```powershell
chatrealm -p "Say exactly: ok"
```

Run with positional prompt text:

```powershell
chatrealm write a short summary of this project
```

Override model and working directory:

```powershell
chatrealm -p "Inspect the project" --model gpt-4.1-mini --cwd D:\My\Project\pi\ChatRealm
```

Select the provider explicitly:

```powershell
chatrealm -p "Say hi" --provider openai-compatible
```

## Local Tools

ChatRealm exposes these tools to the model:

```text
read_file      Read a UTF-8 text file inside the agent working directory.
search         Search UTF-8 text files inside the agent working directory.
write_file     Write a UTF-8 text file inside the agent working directory.
shell_command  Run a shell command in the agent working directory.
```

File tools resolve paths inside the configured `cwd`. The shell tool runs local commands with a timeout and returns stdout, stderr, and exit code.

## Sessions

After a successful agent loop, ChatRealm saves message history to:

```text
<cwd>/.chatrealm/sessions/default.json
```

On the next run with the same `cwd`, ChatRealm loads that file before appending the new user prompt. If the session JSON is corrupt or has an unsupported shape, the CLI exits with a `Session error:` message instead of overwriting it.

The repository root `.gitignore` ignores `ChatRealm/.chatrealm/`, but a different `--cwd` may create `.chatrealm/` outside this project.

## Current Limitations

- Print mode and basic interactive mode only; there is no TUI or RPC mode.
- Interactive mode streams assistant text, but print mode still waits for the final response.
- One OpenAI-compatible provider path; there is no provider registry.
- Tool execution has no approval workflow.
- The shell tool runs local commands in the configured working directory.
- Session persistence is a single JSON file with no compaction.
- There is no plugin system, skill system, sandbox service, or marketplace.
- Failed agent loops do not save partial sessions.
- The package is private and not prepared for binary distribution.

## Architecture Milestones

Useful next steps after the MVP:

1. Add a provider registry so provider selection is not hardcoded.
2. Add tool approval or policy checks before write and shell operations.
3. Add streaming output for provider text deltas.
4. Add session compaction and named sessions.
5. Add a small TUI after print mode behavior is stable.
6. Add packaging only after the runtime contract is stable.
