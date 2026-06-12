# MVP Agent 实现计划

## 工件元数据

- 工件：project-todo
- 语言：中文
- 规范版本：false
- 项目类型：全新的 TypeScript CLI 应用
- 参考项目：pi monorepo 架构索引

## 项目摘要

构建一个受 `pi` 启发的最小但真实可用的 coding agent。MVP 项目是 `ChatRealm`。它应能从终端运行，接收用户提示词，调用 LLM provider，可选地使用一小组本地工具，维护简单的对话状态，并打印有用结果。目标是通过小步骤重建核心架构来学习，而不是克隆所有生产级功能。

## 范围

### 范围内

- TypeScript CLI 应用。
- 优先实现打印模式：`agent "your task"` 或 `agent -p "your task"`。
- 最小 LLM adapter 抽象。
- 一个 OpenAI 兼容的 chat/completions provider。
- 支持 tool-call 的 agent loop。
- 一个小型工具注册表，包含文件系统读取、文件系统写入、 grep/search 和 shell 命令工具。
- 使用 JSON session 持久化基础对话历史。
- 从环境变量和本地配置文件加载基础配置。
- 针对 parser、tool registry 和 agent loop 行为的聚焦测试。

### 范围外

- 完整 TUI。
- RPC 模式。
- 插件市场或 skill 系统。
- 生产级多 provider registry。
- 流式渲染器。
- session 压缩。
- 图像生成。
- 二进制打包。

## 计划结构

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

## 有序 TODO 项

### TODO-001：搭建 TypeScript CLI 项目骨架

- 状态：completed
- 目标：创建一个最小的独立 TypeScript CLI 项目，使其在任何 agent 逻辑存在之前就可以本地安装、类型检查并执行。
- 范围：
  - 创建 `ChatRealm/` 项目目录。
  - 添加 npm package 元数据和脚本。
  - 添加严格的 TypeScript 配置。
  - 添加第一个 `src/main.ts` CLI 入口点。
  - 让 CLI 打印占位消息并成功退出。
  - 暂不实现参数解析、配置加载、provider 调用、工具、session 或测试。
- 可能涉及的文件或区域：`ChatRealm/package.json`、`ChatRealm/tsconfig.json`、`ChatRealm/src/main.ts`、可选的 `ChatRealm/README.md`
- 依赖：无
- 建议 package 选择：
  - 运行时：Node.js with TypeScript。
  - 模块系统：ESM。
  - 直接依赖：本 TODO 不需要，除非本地 runner 需要。
  - 开发依赖：`typescript` 和一个 TypeScript runner，例如 `tsx`。
- 分步实现指南：
  1. 创建项目文件夹。
     - 从仓库根目录创建 `mvp-agent/`。
     - 这个学习项目的所有文件都应位于 `mvp-agent/` 下。
  2. 初始化 npm 元数据。
     - 在 `mvp-agent/` 内运行 `npm init -y`，或手动创建 `package.json`。
     - 设置清晰的 package name，例如 `mvp-agent`。
     - 设置 `"type": "module"`，使 Node 将生成的 JavaScript 视为 ESM。
     - 保留 `"private": true`，因为这个 MVP 尚未准备发布。
  3. 安装开发依赖。
     - 从 `mvp-agent/` 安装 TypeScript 工具：`npm install --save-dev --ignore-scripts typescript tsx`。
     - 不要在 TODO-001 添加运行时依赖。
  4. 向 `package.json` 添加 npm scripts。
     - 添加 `"check": "tsc --noEmit"`。
     - 添加 `"dev": "tsx src/main.ts"`。
     - 添加 `"start": "tsx src/main.ts"`。
     - 目前 `dev` 和 `start` 可以相同，因为还没有 build 输出。
  5. 创建 `tsconfig.json`。
     - 使用严格 TypeScript 设置。
     - 将 `target` 设为现代 Node 兼容值，例如 `ES2022`。
     - 将 `module` 和 `moduleResolution` 设为 Node ESM 兼容值。
     - 目前只 include `src/**/*.ts`。
     - 暂不配置测试文件。
     - 推荐起始内容：
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
     - 字段说明：
       - `target`：告诉 TypeScript 按哪个 JavaScript 语言级别进行类型检查。`ES2022` 是现代 Node 的良好基线。
       - `module`：告诉 TypeScript 如何解释模块。`NodeNext` 匹配 Node 的现代 ESM 行为。
       - `moduleResolution`：告诉 TypeScript 如何查找被导入的文件和 package。与 `module: NodeNext` 一起使用 `NodeNext`。
       - `strict`：启用重要的 TypeScript 安全检查。从一开始就保持开启。
       - `noEmit`：阻止 `tsc` 生成 JavaScript 文件。在这个 MVP 步骤中，`tsx` 会直接运行 `.ts` 文件。
       - `esModuleInterop`：让后续 CommonJS package 互操作更顺畅。
       - `forceConsistentCasingInFileNames`：捕获路径大小写错误，这类错误可能在 Windows 可用但在 Linux/macOS 失败。
       - `skipLibCheck`：跳过依赖声明文件的类型检查，让初学者反馈集中在自己的代码上。
       - `include`：将 TypeScript 检查限制到 `src/` 下的源文件。
     - 重要初学者规则：
       - `tsconfig.json` 不运行程序。它只配置 TypeScript 如何检查程序。
       - `npm run check` 通过 `tsc --noEmit` 使用此文件。
       - `npm run dev` 使用 `tsx src/main.ts` 运行程序。
  6. 创建 source 目录。
     - 创建 `src/`。
     - 创建 `src/main.ts`。
  7. 添加第一个 CLI 入口点。
     - 在 `src/main.ts` 中打印一行占位文本。
     - 保持文件简单；`console.log("mvp-agent: ready");` 就足够。
     - 暂不读取 `process.argv`；TODO-002 会添加参数解析。
  8. 运行第一次验证。
     - 运行 `npm run check`。
     - 运行 `npm run dev`。
     - 运行 `npm start`。
     - 在继续之前修复所有 TypeScript 或脚本错误。
  9. 检查最终骨架。
     - 确认文件夹只包含本 TODO 所需的最小文件。
     - 预期文件为 `package.json`、`package-lock.json`、`tsconfig.json`、`src/main.ts`，安装后还有 `node_modules/`。
     - `node_modules/` 应存在于本地，但在真实 git 项目中不应提交。
- 最小预期文件内容：
  - `package.json` 应包含 package 元数据、`"type": "module"`、`"private": true` 和上面的三个 scripts。
  - `tsconfig.json` 应启用严格类型检查并 include `src/**/*.ts`。
  - `src/main.ts` 应只打印占位消息。
- 初学者说明：
  - `package.json` 描述 npm 如何运行项目。
  - `tsconfig.json` 告诉 TypeScript 严格程度以及检查哪些文件。
  - `tsx` 允许 Node 在开发期间直接运行 `.ts` 文件。
  - `tsc --noEmit` 检查类型但不创建 JavaScript 输出文件。
  - ESM 表示后续使用现代 `import` 和 `export` 语法。
- 必需 npm scripts：
  - `check`：运行 TypeScript 类型检查，不输出文件。
  - `dev`：直接运行 `src/main.ts` 进行本地开发。
  - `start`：目前以相同的占位模式运行 CLI 入口点。
- 实现说明：
  - 保持 `src/main.ts` 有意精简。
  - 占位输出应明显表明 binary 已启动，例如 `mvp-agent: ready`。
  - 现在避免添加 CLI parsing；TODO-002 负责它。
  - 现在避免添加 AI/config/tool 抽象；后续 TODO 负责这些边界。
- 验收标准：
  - 在 `mvp-agent/` 内执行 `npm install --ignore-scripts` 成功。
  - `npm run check` 成功。
  - `npm run dev` 打印占位消息并以 exit code 0 退出。
  - `npm start` 打印占位消息并以 exit code 0 退出。
  - `package.json` 通过 `"type": "module"` 使用 ESM。
  - `tsconfig.json` 已启用严格类型检查。
  - 项目没有未使用的占位模块或宽泛抽象。
  - 创建的文件仅限于本 TODO 所需的骨架。
- Reviewer checklist：
  - 确认项目是独立的，不依赖父级 `pi` workspace。
  - 确认 TypeScript strict mode 已启用。
  - 确认没有 dynamic imports 或 non-erasable TypeScript 语法。
  - 确认骨架为 TODO-002 留出干净扩展点，但没有提前实现它。

### TODO-002：实现 CLI 参数解析

- 状态：completed
- 目标：让 CLI 能理解来自终端的用户输入，但暂不启动任何真实 agent 逻辑。
- 范围：

  - 在 `src/cli/args.ts` 添加一个小型参数 parser。
  - 支持通过 `-p "text"` 和 `--prompt "text"` 输入 prompt。
  - 支持通过位置文本输入 prompt，例如 `npm run dev -- "say hi"`。
  - 支持可选 flags：`--model`、`--provider` 和 `--cwd`。
  - 支持 `--help` 和 `-h`。
  - 更新 `src/main.ts` 调用 parser 并打印解析结果。
  - 不要加载配置、调用 LLM、运行工具或持久化 session。
- 可能涉及的文件或区域：`ChatRealm/src/cli/args.ts`、`ChatRealm/src/main.ts`
- 依赖：TODO-001
- 分步实现指南：

  1. 创建 CLI 文件夹。
     - 创建 `src/cli/`。
     - 创建 `src/cli/args.ts`。
  2. 定义解析后的参数类型。
     - 添加一个导出的 interface，命名为 `ParsedArgs`。
     - 它应包含：
       - `prompt: string | undefined`
       - `model: string | undefined`
       - `provider: string | undefined`
       - `cwd: string | undefined`
       - `help: boolean`
     - 对用户未提供的值使用 `undefined`。
     - 将此类型放在 `src/cli/args.ts` 顶部附近。
     - 推荐代码：
       ```ts
       export interface ParsedArgs {
         prompt: string | undefined;
         model: string | undefined;
         provider: string | undefined;
         cwd: string | undefined;
         help: boolean;
       }
       ```
     - 为什么需要这个 interface：
       - parser 接收来自终端的原始字符串。
       - 程序其余部分不应直接处理原始字符串。
       - `ParsedArgs` 是后续代码可以信任的干净形状。
     - 每个字段存在的原因：
       - `prompt`：用户的任务文本，例如 `write a greeting`。
       - `model`：可选 model override，例如 `gpt-4.1-mini`。
       - `provider`：可选 provider override，例如 `openai-compatible`。
       - `cwd`：可选工作目录 override。
       - `help`：用户是否请求 help 输出。
     - 为什么使用 `string | undefined`：
       - `string` 表示用户提供了值。
       - `undefined` 表示用户没有提供该选项。
       - 这比使用空字符串更清晰，因为空字符串也可能是真实用户输入。
     - 为什么 `help` 只是 `boolean`：
       - Help 只有请求或未请求两种状态。
       - 它不需要字符串值。
     - 不要做什么：
       - 不要使用 `any`。
       - 本 TODO 中不要用 `?` 把每个字段都设为 optional；显式 `undefined` 让 parser 结果在学习时更易检查。
       - 不要把运行时逻辑放进 interface。Interfaces 是 TypeScript-only 类型声明。
  3. 定义 parser 函数。
     - 导出名为 `parseArgs` 的函数。
     - 建议签名：`parseArgs(argv: string[]): ParsedArgs`。
     - 输入应只包含用户参数，而不是完整 `process.argv`。
     - 后续 `main.ts` 可以用 `process.argv.slice(2)` 调用它。
     - 推荐函数骨架：
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
     - `argv` 的含义：
       - `argv` 是 "argument vector" 的缩写。
       - 它只是一个字符串数组。
       - 对于 `npm run dev -- --prompt "hello"`，parser 应接收 `["--prompt", "hello"]`。
       - 对于 `npm run dev -- write a greeting`，parser 应接收 `["write", "a", "greeting"]`。
     - 为什么 `parseArgs` 不应直接读取 `process.argv`：
       - 纯函数更容易理解。
       - 纯函数更容易后续测试。
       - `main.ts` 负责 `process.argv` 等 Node-specific 细节。
       - `args.ts` 只应知道如何将 `string[]` 转换为 `ParsedArgs`。
     - 此函数在后续步骤中如何演进：
       - 从上面的骨架开始。
       - Step 4 添加 `--help` 和 `-h`。
       - Step 5 添加带值 flags。
       - Step 6 添加位置 prompt 处理。
       - Step 7 添加 unknown flag 错误。
     - 初学者调试提示：
       - 构建 parser 时，可以临时在 `main.ts` 添加 `console.log(argv)`，不要放在最终 parser 内。
       - 请求 review 前删除临时 debug 输出。
     - 不要做什么：
       - 不要让 `parseArgs` 变成 async；这里不需要 I/O。
       - 不要修改 `process.argv`。
       - 不要从 `parseArgs` 内退出进程。
       - 不要从 `parseArgs` 内打印 help text；它应只返回数据或抛出错误。
  4. 先处理 boolean help flags。
     - 如果参数是 `--help` 或 `-h`，设置 `help: true`。
     - Help 可以和其他参数同时出现，但 `main.ts` 应展示 help 并停止。
     - 推荐方式：
       - 使用 `for` 循环遍历 `argv`。
       - 将当前参数读取到变量中，例如 `arg`。
       - 如果 `arg === "--help" || arg === "-h"`，设置 `parsed.help = true`。
       - 继续循环，让其他参数仍可被扫描。
     - 示例代码形状：
       ```ts
       for (let index = 0; index < argv.length; index += 1) {
         const arg = argv[index];

         if (arg === "--help" || arg === "-h") {
           parsed.help = true;
           continue;
         }
       }
       ```
     - 为什么要早处理 help：
       - Help 不需要后续值。
       - 即使用户只运行 `--help`，help 也应被接受。
       - `main.ts` 后续可以决定打印 usage 并跳过正常执行。
     - 预期示例：
       - `parseArgs(["--help"])` 应产生 `help: true`。
       - `parseArgs(["-h"])` 应产生 `help: true`。
       - `parseArgs(["--help", "--model", "demo"])` 仍应产生 `help: true`。
     - 不要做什么：
       - 不要在这里调用 `console.log`。
       - 不要在这里调用 `process.exit`。
       - 不要因为出现 help 就提前 return；后续步骤仍可一致地解析剩余内容。
  5. 处理带值 flags。
     - `-p` 和 `--prompt` 消费下一个参数作为 prompt 文本。
     - `--model` 消费下一个参数作为 model。
     - `--provider` 消费下一个参数作为 provider。
     - `--cwd` 消费下一个参数作为 cwd。
     - 如果带值 flag 缺少值，抛出带清晰消息的 `Error`，例如 `Missing value for --model`。
     - 带值 flag 是必须跟随另一个参数的选项。
       - 在 `["--model", "demo-model"]` 中，`--model` 是 flag，`demo-model` 是它的值。
       - 在 `["-p", "hello"]` 中，`-p` 是 flag，`hello` 是它的值。
     - 在 `parseArgs` 内添加一个小 helper 读取下一个值：
       ```ts
       	const readValue = (flag: string, index: number): string => {
         const value = argv[index + 1];

         if (value === undefined) {
           throw new Error(`Missing value for ${flag}`);
         }

         return value;
       };
       ```
     - 然后在循环内使用它：
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
     - 为什么需要 `index += 1`：
       - 下一个数组项已作为此 flag 的值被消费。
       - 没有 `index += 1`，循环后续会把该值当作位置 prompt。
     - 对以下 flags 重复相同模式：
       - `--provider`
       - `--cwd`
     - 应抛错的缺失值示例：
       - `parseArgs(["--model"])`
       - `parseArgs(["--provider"])`
       - `parseArgs(["--cwd"])`
       - `parseArgs(["-p"])`
     - 初学者边界情况：
       - 对此 MVP 来说，如果下一个值以 `-` 开头，也可以仍接受它作为值。
       - 示例：`--prompt --help` 可以将 prompt 解析为 `"--help"`。
       - 这让第一个 parser 保持简单。更高级的校验可之后再加。
     - 不要做什么：
       - 不要静默忽略缺失值。
       - 不要把缺失值默认成空字符串。
       - 不要在这里放 provider/model defaults；配置加载属于 TODO-003。
       - 除非有意文档化，否则暂不支持 `--model=demo`。本 TODO 中空格分隔值已足够。
  6. 处理位置 prompt 文本。
     - 任何不是已知 flag 的参数都应成为位置 prompt 的一部分。
     - 用单个空格连接位置 prompt 片段。
     - 示例：`["write", "a", "haiku"]` 变成 `prompt: "write a haiku"`。
     - 如果已经通过 `-p/--prompt` 提供 prompt，目前优先使用显式 prompt，并忽略位置 prompt。
     - “位置参数”是什么意思：
       - 位置参数就是没有跟在某个 flag 名字后面的参数。
       - 在 `agent --model demo write a greeting` 中，`--model` 是 flag，`demo` 是这个 flag 的值，`write`、`a`、`greeting` 是位置 prompt 片段。
       - 在 `agent "write a greeting"` 中，整个 `"write a greeting"` 字符串就是一个位置参数。
     - 添加一个本地数组收集位置片段：
       ```ts
       const positionalParts: string[] = [];
       ```
     - 把这个数组放在 `parseArgs` 顶部附近，在 `parsed` 对象之后、循环之前。
     - 在循环内部，所有已知 flag 检查都完成之后，把当前参数当成位置文本：
       ```ts
       positionalParts.push(arg);
       ```
     - 到达循环里的这个位置时，`arg` 可以安全收集，因为：
       - `--help` 和 `-h` 已经执行了 `continue`。
       - `--model demo` 这类带值 flag 已经消费了自己的值，并执行了 `continue`。
       - 已知 flag 已经被处理完。
     - 循环结束后，把收集到的片段转换成最终 prompt：
       ```ts
       if (parsed.prompt === undefined && positionalParts.length > 0) {
         parsed.prompt = positionalParts.join(" ");
       }
       ```
     - 为什么要在循环结束后处理：
       - parser 需要先看完所有参数，才知道完整的位置参数有哪些。
       - 最后只 join 一次，比在循环里不断修改 `parsed.prompt` 更简单。
       - 这样显式 prompt 也更容易处理：`-p "hello"` 优先于位置文本。
     - 为什么检查 `parsed.prompt === undefined`：
       - `-p` 和 `--prompt` 是用户显式选择。
       - 本 MVP 中，显式 prompt 应优先于位置文本。
       - 示例：`agent -p "hello" ignored words` 目前应保留 `prompt: "hello"`。
     - 手动推演示例：
       - `parseArgs(["write", "a", "haiku"])` 应返回 `prompt: "write a haiku"`。
       - `parseArgs(["--model", "demo", "write", "a", "haiku"])` 应返回 `model: "demo"` 和 `prompt: "write a haiku"`。
       - `parseArgs(["-p", "hello", "ignored"])` 应返回 `prompt: "hello"`。
       - `parseArgs([])` 应保持 `prompt: undefined`。
     - 初学者调试提示：
       - 如果某个 flag 的值意外出现在 prompt 里，检查读取该 flag 值后是否忘了 `index += 1`。
       - 如果所有位置文本都消失了，检查 `positionalParts.push(arg)` 是否放在某个会跳过它的 `continue` 之前。
     - 不要做什么：
       - 不要直接 join 整个 `argv`；那会意外包含 `--model` 这类 flags。
       - 不要让位置文本覆盖 `-p` 或 `--prompt`。
       - 暂时不要 trim 或校验 prompt，除非你有意记录这个行为。
       - 不要在这里添加 config defaults；parser 只应反映用户实际输入。
  7. 处理 unknown flags。
     - 如果参数以 `-` 开头且不受支持，抛出 `Error`。
     - 示例消息：`Unknown option: --bad`。
     - 为什么需要这一步：
       - 如果不处理 unknown flag，像 `--modle demo` 这样的拼写错误会被当成位置 prompt 文本。
       - 这会掩盖用户输入错误，让 CLI 行为变得不可预测。
       - CLI 遇到不认识的选项时，应尽早失败。
     - 这个检查放在哪里：
       - 放在 `for` 循环内部。
       - 放在所有已支持 flag 的判断之后。
       - 放在 `positionalParts.push(arg)` 之前。
     - 顺序应类似这样：
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

         // 其他已知 flags 放在这里。

         if (arg.startsWith("-")) {
           throw new Error(`Unknown option: ${arg}`);
         }

         positionalParts.push(arg);
       }
       ```
     - 为什么本 MVP 中 `startsWith("-")` 就够用：
       - CLI flags 通常以 `-` 开头，例如 `-p` 或 `--model`。
       - 位置 prompt 文本通常不以 `-` 开头。
       - 这个简单规则能捕获常见错误，同时避免引入复杂 parser。
     - 重要边界情况：
       - 在这个 MVP 中，如果位置 prompt 文本以 `-` 开头，会被拒绝。
       - 示例：`agent explain --not-a-real-flag` 应抛出 `Unknown option: --not-a-real-flag`。
       - 如果用户确实需要传入以 `-` 开头的 prompt 文本，可以使用 `-p "--not-a-real-flag"`，因为第 5 步允许 flag 的值以 `-` 开头。
     - 手动示例：
       - `parseArgs(["--bad"])` 应抛出 `Unknown option: --bad`。
       - `parseArgs(["--model", "demo", "--bad"])` 应抛出 `Unknown option: --bad`。
       - `parseArgs(["write", "--bad"])` 应抛出 `Unknown option: --bad`。
       - `parseArgs(["-p", "--bad"])` 应返回 `prompt: "--bad"`，因为 `--bad` 是被 `-p` 消费的值。
       - `parseArgs(["--prompt", "--bad"])` 也应返回 `prompt: "--bad"`，原因相同。
     - 在 `main.ts` 已接入 parser 输出后如何验证：
       - `npm run dev -- -- --bad`
       - 预期终端输出应包含 `Unknown option: --bad`。
       - 进程应以非零状态退出，因为 `main.ts` 在 `catch` 中设置了 `process.exitCode = 1`。
     - 初学者调试提示：
       - 如果 `--bad` 出现在打印的 JSON prompt 里，unknown flag 检查很可能放在了 `positionalParts.push(arg)` 之后，或根本没写。
       - 如果 `-p --bad` 抛出 unknown option 错误，unknown flag 检查很可能在 `-p` 分支消费值之前运行了。
     - 不要做什么：
       - 不要静默忽略 unknown flags。
       - 不要把 unknown flags 加进 `positionalParts`。
       - 不要添加 TODO 中没有列出的别名。
       - 暂时不要引入第三方参数解析库；目标是先理解机制。
  8. 添加 help text 函数。
     - 从 `src/cli/args.ts` 导出名为 `getHelpText` 的函数。
     - 让它和 `parseArgs` 保持分离：`parseArgs` 负责解析输入，`getHelpText` 负责返回展示文本。
     - 本 TODO 中，这个函数不应打印、不应退出进程、不应读取文件，也不需要接收参数。
     - 使用字符串数组加 `join("\n")`，这样 Markdown 代码块更容易阅读。
     - 推荐实现：

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
     - 在这段 usage text 中，`[options]` 和 `[prompt]` 表示这些部分是可选的。
     - Help text 只记录 TODO-002 已经存在的功能。暂时不要提配置文件、LLM 调用、工具、session 或未来模式。
     - Step 9 会在 `main.ts` 中这样使用它：

       ```ts
       if (parsed.help) {
         console.log(getHelpText());
         return;
       }
       ```
     - Step 9 接好 `main.ts` 后的手动检查：

       - `npm run dev -- -- --help` 应打印 help text，而不是 JSON。
       - `npm run dev -- -- -h` 应打印相同的 help text。
       - Help 输出应成功退出。
     - 初学者检查：

       - 如果 TypeScript 报字符串未结束，确认数组里的每个字符串都有成对引号。
       - 如果 `--help` 仍打印 JSON，确认 `main.ts` 在打印解析对象之前先检查 `parsed.help`。
       - 如果 help text 记录了某个 flag，这个 flag 应该已经被 `parseArgs` 支持。
  9. 更新 `src/main.ts`。
     - 导入 `parseArgs` 和 `getHelpText`。
     - 调用 `parseArgs(process.argv.slice(2))`。
     - 如果 `help` 为 true，打印 help text 并正常退出。
     - 否则使用 `console.log(JSON.stringify(parsed, null, 2));` 打印解析对象。
     - 用 `try/catch` 包裹 parsing；遇到 parse errors 时打印错误消息并设置 `process.exitCode = 1`。
  10. 运行手动检查。
      - `npm run check`
      - `npm run dev -- --help`
      - `npm run dev -- -p "hello"`
      - `npm run dev -- --prompt "hello" --model demo-model --provider demo --cwd .`
      - `npm run dev -- write a short greeting`
      - `npm run dev -- --bad`
- 初学者说明：

  - `process.argv` 是来自 Node 的原始参数列表。
  - `process.argv.slice(2)` 移除 Node 可执行文件路径和脚本路径，只留下用户输入。
  - npm 需要用 `--` 将参数传给脚本。示例：`npm run dev -- --help`。
  - parser 应将杂乱的终端字符串转换为程序其余部分可使用的干净对象。
- 验收标准：

  - `npm run check` 成功。
  - `npm run dev -- --help` 打印 usage text 并以 exit code 0 退出。
  - `npm run dev -- -p "hello"` 打印包含 `"prompt": "hello"` 的 JSON。
  - `npm run dev -- --prompt "hello" --model demo-model --provider demo --cwd .` 打印所有提供的值。
  - `npm run dev -- write a short greeting` 打印包含 `"prompt": "write a short greeting"` 的 JSON。
  - `npm run dev -- --bad` 打印清晰的 unknown option 错误并以非零状态退出。
  - 缺失 flag 值时产生清晰错误。
  - 本 TODO 不添加配置加载、LLM 调用、工具、session 或测试。
- Reviewer checklist：

  - 确认 parser 逻辑隔离在 `src/cli/args.ts`。
  - 确认 `main.ts` 目前只连接 parser 输出。
  - 确认没有 `any`。
  - 确认实现没有使用 dynamic imports。
  - 确认 parser 是确定性的，且在 TODO-014 中易于测试。

### TODO-003：添加配置加载

- 状态：pending
- 目标：添加一个小型配置层，让后续 TODO 可以获取 provider 设置，而不需要在业务代码里直接读取环境变量或 JSON 文件。
- 范围：
  - 创建 `src/config/config.ts`。
  - 创建 `src/utils/json.ts`。
  - 从环境变量加载配置。
  - 从可选本地 JSON 配置文件加载配置。
  - 用清晰的优先级合并配置值。
  - 提供默认工作目录。
  - 暂不调用 LLM、不创建 provider 对象、不运行工具、不持久化 session、不添加测试。
- 可能涉及的文件或区域：`src/config/config.ts`、`src/utils/json.ts`
- 依赖：TODO-001、TODO-002
- 配置来源设计：
  - 本地配置文件名：`chatrealm.config.json`。
  - 默认查找位置：当前工作目录。
  - 可选配置路径 override：`CHATREALM_CONFIG`。
  - 环境变量：
    - `CHATREALM_API_KEY`
    - `CHATREALM_BASE_URL`
    - `CHATREALM_MODEL`
    - `CHATREALM_CWD`
  - JSON 配置 keys：
    - `apiKey`
    - `baseUrl`
    - `model`
    - `cwd`
  - 优先级：
    - 环境变量覆盖配置文件值。
    - 配置文件值覆盖内置默认值。
    - 未提供 `cwd` 时默认使用 `process.cwd()`。
    - API key、base URL 和 model 目前可以保持 `undefined`；TODO-005 或 TODO-011 再决定它们什么时候必须存在。
- 分步实现指南：
  1. 创建文件夹。
     - 创建 `src/config/`。
     - 创建 `src/utils/`。
     - 创建 `src/config/config.ts`。
     - 创建 `src/utils/json.ts`。
  2. 在 `src/config/config.ts` 中定义配置类型。
     - 导出名为 `AppConfig` 的 interface。
     - 对可选 provider 设置使用显式的 `string | undefined`。
     - `cwd` 保持必需的 `string`，因为程序应始终有一个工作目录。
     - 推荐形状：
       ```ts
       export interface AppConfig {
         apiKey: string | undefined;
         baseUrl: string | undefined;
         model: string | undefined;
         cwd: string;
       }
       ```
     - 为什么 `cwd` 不是 optional：
       - 后续文件工具会需要工作目录。
       - 如果用户没有提供，`process.cwd()` 是合理默认值。
  3. 定义一个小型 load-options 类型。
     - 导出名为 `LoadConfigOptions` 的 interface。
     - 这会让 loader 更容易手动验证，后续也更容易测试。
     - 暂时避免使用 `NodeJS.ProcessEnv`，这样本学习步骤不需要额外理解 Node 类型细节。
     - 推荐形状：
       ```ts
       export interface LoadConfigOptions {
         env?: Record<string, string | undefined>;
         cwd?: string;
       }
       ```
     - `env` 让测试或手动检查以后可以传入假的环境变量。
     - `cwd` 让调用方选择从哪里查找 `chatrealm.config.json`。
  4. 在 `src/utils/json.ts` 中添加 JSON object parser。
     - 导出名为 `parseJsonObject` 的函数。
     - 它应接收 `text: string` 和 `sourceName: string`。
     - 它应返回 `Record<string, unknown>`。
     - 如果 JSON 解析失败，或解析结果不是 object，应抛出清晰错误。
     - 从这个函数骨架开始：

       ```ts
       export function parseJsonObject(
         text: string,
         sourceName: string,
       ): Record<string, unknown> {
         // Implementation goes here.
       }
       ```
     - 在 `try/catch` 中解析 JSON。
     - 将解析结果保存在一个类型为 `unknown` 的变量中。
     - 使用 `unknown`，因为文件内容可能是任何东西：object、array、string、number、`true`、`false` 或 `null`。
     - 推荐解析代码：

       ```ts
       let parsed: unknown;

       try {
         parsed = JSON.parse(text);
       } catch {
         throw new Error(`Invalid JSON in ${sourceName}`);
       }
       ```
     - 解析后，验证这个值是普通 JSON object。
     - 这个检查需要三部分：

       - `typeof parsed === "object"` 确认它像 object。
       - `parsed !== null` 排除 `null`，因为 JavaScript 中 `typeof null` 的结果也是 `"object"`。
       - `!Array.isArray(parsed)` 排除数组，因为数组在 JavaScript 中也是 object，但本 TODO 中它不是有效 config object。
     - 推荐 object 检查：

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
     - 为什么这里可以使用最后的类型断言：

       - 运行时检查已经证明它是非 null object，且不是数组。
       - TypeScript 仍然不知道它的每个 key 都映射到 `unknown`。
       - `Record<string, unknown>` 是安全形状，因为每个值仍未被信任。
       - Step 5 会在把值当成 string 使用前，逐个验证字段值。
     - 完整推荐实现：

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
     - 手动推演示例：

       - `parseJsonObject("{\"model\":\"demo\"}", "chatrealm.config.json")` 应成功。
       - `parseJsonObject("{", "chatrealm.config.json")` 应抛出 `Invalid JSON in chatrealm.config.json`。
       - `parseJsonObject("null", "chatrealm.config.json")` 应抛出 `Expected JSON object in chatrealm.config.json`。
       - `parseJsonObject("[]", "chatrealm.config.json")` 应抛出 `Expected JSON object in chatrealm.config.json`。
       - `parseJsonObject("\"hello\"", "chatrealm.config.json")` 应抛出 `Expected JSON object in chatrealm.config.json`。
     - 不要做什么：

       - 不要直接返回 `JSON.parse` 的原始结果。
       - 不要使用 `any`。
       - JSON 无效时不要静默返回 `{}`。
       - 不要在这个函数中验证 `apiKey`、`baseUrl`、`model` 或 `cwd`；Step 5 负责字段值级别的验证。
  5. 添加读取可选 string keys 的 helper。
     - 在 `src/utils/json.ts` 中导出名为 `readOptionalString` 的函数。
     - 建议签名：

       ```ts
       export function readOptionalString(
         object: Record<string, unknown>,
         key: string,
         sourceName: string,
       ): string | undefined
       ```
     - 如果 key 不存在，返回 `undefined`。
     - 如果值是 string，返回它。
     - 如果值存在但不是 string，抛出清晰错误，例如 `Expected string for model in chatrealm.config.json`。
     - 不要使用 `any`。
     - 为什么需要这个 helper：

       - `parseJsonObject` 只证明了整个 JSON 文件是一个 object。
       - 它不能证明 `object.model`、`object.apiKey` 或其他字段一定是 string。
       - JSON 文件是外部输入，所以 TypeScript 不能信任里面的内容。
       - 这个 helper 把“检查可选 string 字段”的逻辑集中到一个小函数里，后面可以重复使用。
     - 这里的“可选 string”是什么意思：

       - key 可以不存在。例如：`{ "model": "demo" }` 里面没有 `apiKey`。
       - 如果 key 不存在，loader 应该把这个值当作“未配置”，并返回 `undefined`。
       - 如果 key 存在，那么它的值必须是 string。
       - `undefined` 表示“没有提供”；对于可选配置项来说，这不是错误。
     - 把这个函数添加在 `src/utils/json.ts` 的 `parseJsonObject` 下面。
     - 推荐实现：

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
     - 从上到下读这段代码：

       - `const value = object[key];` 是从 JSON object 里读取一个属性。
       - `object[key]` 叫方括号属性访问。这里使用它，是因为 `key` 是一个变量。
       - 如果 `key` 是 `"model"`，那么 `object[key]` 就等价于 `object.model`。
       - `value === undefined` 表示 JSON object 没有这个 key，或者这个 key 的值实际是 `undefined`。
       - JSON 文件本身不能自然写出 `undefined`，所以在这个 TODO 里可以把它理解为“缺失”。
       - `typeof value !== "string"` 会拦截 number、boolean、array、object、`null` 等无效值。
       - 通过这个检查之后，TypeScript 就能理解 `value` 是一个 `string`。
       - 最后返回 `value` 是安全的，因为非 string 值已经被前面的检查拒绝了。
     - 为什么函数需要 `sourceName`：

       - 错误消息应该告诉用户坏值来自哪里。
       - `Expected string for model in chatrealm.config.json` 比 `Invalid config` 更容易定位和修复。
       - 后续如果配置可以来自其他文件，同一个 helper 仍然能产生有用的错误消息。
     - 为什么返回类型是 `string | undefined`：

       - `string` 表示配置文件提供了合法值。
       - `undefined` 表示配置文件没有提供这个 key。
       - 不要用空字符串作为默认值，因为空字符串可能掩盖配置错误。
     - 手动推理几个例子：

       - `readOptionalString({ model: "demo" }, "model", "chatrealm.config.json")` 应该返回 `"demo"`。
       - `readOptionalString({}, "model", "chatrealm.config.json")` 应该返回 `undefined`。
       - `readOptionalString({ model: 123 }, "model", "chatrealm.config.json")` 应该抛出 `Expected string for model in chatrealm.config.json`。
       - `readOptionalString({ model: null }, "model", "chatrealm.config.json")` 应该抛出 `Expected string for model in chatrealm.config.json`。
       - `readOptionalString({ model: ["demo"] }, "model", "chatrealm.config.json")` 应该抛出 `Expected string for model in chatrealm.config.json`。
     - 初学者检查点：

       - 如果 TypeScript 说 `object` 有 implicit `any` 类型，确认参数写的是 `object: Record<string, unknown>`。
       - 如果 TypeScript 说 `key` 有 implicit `any` 类型，确认参数写的是 `key: string`。
       - 如果 TypeScript 说函数缺少返回值，确认每个分支都 `return` 或 `throw`。
       - 如果错误消息打印了错误的字段名，确认模板字符串里使用的是 `${key}`。
       - 模板字符串使用反引号，不是普通引号：`` `Expected string for ${key} in ${sourceName}` ``。
     - 不要这样做：

       - 不要写 `return object[key] as string`；这会跳过运行时校验。
       - 不要使用 `String(value)`；它会悄悄把 `123` 变成 `"123"`，从而隐藏错误配置。
       - key 缺失时不要返回 `""`；请返回 `undefined`。
       - 不要在这个 helper 里验证字符串是不是有效 API key、URL、model name 或路径。
       - 不要在这个 helper 里读文件；读文件属于 `loadConfig` 的职责。
  6. 在 `src/config/config.ts` 中实现配置文件加载。
     - 在文件顶部导入 Node built-ins：

       ```ts
       import { existsSync, readFileSync } from "node:fs";
       import { resolve } from "node:path";
       ```
     - 从 `../utils/json.js` 导入 JSON helpers。
     - 在 `loadConfig` 内确定：

       - `env`：默认使用 `process.env`。
       - `cwd`：默认使用 `process.cwd()`。
       - `configPath`：如果存在 `env.CHATREALM_CONFIG` 就用它，否则使用 `resolve(cwd, "chatrealm.config.json")`。
     - 如果配置文件存在，以 UTF-8 读取并解析。
     - 如果配置文件不存在，继续使用空对象。
     - 本 TODO 不创建配置文件。
     - 为什么需要这一步：

       - 后续代码应该只调用一个函数 `loadConfig`，而不是到处都知道配置文件放在哪里。
       - 这样可以把文件系统细节限制在 `src/config/config.ts` 里。
       - 也可以避免 provider、agent、tool 代码直接读取环境变量。
     - 把 imports 放在 `src/config/config.ts` 文件最顶部。
     - 从 `../utils/json.js` 导入 Step 4 和 Step 5 里的两个 helper：

       ```ts
       import { parseJsonObject, readOptionalString } from "../utils/json.js";
       ```
     - 为什么导入路径以 `.js` 结尾：

       - 这个 TypeScript 项目使用 Node ESM 设置。
       - 在 Node ESM 风格的 TypeScript 中，本地相对导入应该写运行时的 `.js` 扩展名。
       - 源文件仍然是 `json.ts`；开发时 TypeScript 能理解 `../utils/json.js` 指向它。
     - 在 `src/config/config.ts` 的 interfaces 下面添加 `loadConfig` 函数。
     - 推荐起始骨架：

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
     - 这个骨架暂时不会通过 TypeScript，因为它还没有返回 `AppConfig`。

       - 如果你正在第 6 步中间，这是正常的。
       - Step 7 会添加最终的 `const config: AppConfig = ...` 和 `return config`。
       - 如果你希望第 6 步写完后立刻 `npm run check` 通过，可以直接继续写 Step 7 的返回部分，而不是停在注释处。
     - 仔细理解前三个常量：

       - `options.env ?? process.env` 表示：如果调用方传了假的/测试用环境变量，就用它；否则使用真实进程环境变量。
       - `options.cwd ?? process.cwd()` 表示：如果调用方传了工作目录，就用它；否则使用启动命令时所在的目录。
       - `env.CHATREALM_CONFIG ?? resolve(cwd, "chatrealm.config.json")` 表示：如果提供了显式配置路径就用它；否则在 `cwd` 里找 `chatrealm.config.json`。
     - `resolve(cwd, "chatrealm.config.json")` 做了什么：

       - 它把工作目录和配置文件名合成一个路径。
       - 如果 `cwd` 是 `/project/ChatRealm`，结果就是 `/project/ChatRealm/chatrealm.config.json`。
       - 在 Windows 上，结果会是 Windows 风格的绝对路径。
       - 使用 `resolve` 比自己用 `/` 拼字符串更稳。
     - 为什么 `fileConfig` 一开始是 `{}`：

       - 配置文件是可选的。
       - 如果文件不存在，loader 仍然需要一个 object 来读取字段。
       - 从 `{}` 读取可选 key 只会得到 `undefined`。
     - `existsSync(configPath)` 做了什么：

       - 它检查当前是否存在这个文件或路径。
       - 如果返回 `true`，本 TODO 就读取文件。
       - 如果返回 `false`，本 TODO 就跳过读取，并保持 `fileConfig` 为 `{}`。
     - `readFileSync(configPath, "utf8")` 做了什么：

       - 它把整个文件读成文本。
       - `"utf8"` 告诉 Node 按普通文本解码文件，而不是返回原始字节。
       - 同步读取在这里可以接受，因为配置加载只发生在 CLI 启动时一次。
     - `parseJsonObject(text, configPath)` 做了什么：

       - 它把文本解析成 JSON。
       - 它会拒绝非法 JSON。
       - 它也会拒绝不是 object 的合法 JSON，例如 `null`、`[]` 或 `"hello"`。
       - 传入 `configPath` 可以让错误消息指向真实文件路径。
     - 为什么这一步先读取文件值再合并：

       - `fileApiKey`、`fileBaseUrl`、`fileModel`、`fileCwd` 只是 JSON 文件里的值。
       - 它们还不包含环境变量覆盖。
       - 把文件值单独放着，Step 7 的优先级规则会更容易看懂。
     - 手动推理几个例子：

       - 如果配置文件不存在，`fileConfig` 应保持为 `{}`。
       - 如果 `chatrealm.config.json` 包含 `{ "model": "demo-model" }`，那么 `fileModel` 应该是 `"demo-model"`。
       - 如果它包含 `{ "model": 123 }`，`readOptionalString` 应该抛出清晰错误。
       - 如果设置了 `CHATREALM_CONFIG`，loader 应该检查那个路径，而不是 `cwd` 里的默认文件。
     - 初学者检查点：

       - 如果 TypeScript 找不到 `node:fs` 或 `process`，后续可能需要安装 Node types，但不要为了绕过问题而改变这个 TODO 的架构。
       - 如果 TypeScript 报 `loadConfig` 没有返回值，先完成 Step 7 再做最终检查。
       - 如果 TypeScript 找不到 `../utils/json.js`，确认 `src/utils/json.ts` 存在，并且从 `src/config/config.ts` 出发的相对路径正确。
       - 如果配置文件明明存在却没有被读取，可以临时打印或检查 `configPath`，确认 `cwd` 指向哪个目录。
     - 不要这样做：

       - 不要自动创建 `chatrealm.config.json`。
       - 不要 catch 后隐藏 JSON parse 错误。
       - 不要在这一步放默认 model 或 API key。
       - 不要在读取文件的代码块里合并环境变量；Step 7 负责优先级。
       - 不要在 `loadConfig` 里调用 LLM 或创建 provider。
  7. 合并文件值和环境变量值。
     - 从 JSON keys 读取文件值：`apiKey`、`baseUrl`、`model`、`cwd`。
     - 从环境变量读取值：`CHATREALM_API_KEY`、`CHATREALM_BASE_URL`、`CHATREALM_MODEL`、`CHATREALM_CWD`。
     - 环境变量优先于文件值。
     - `cwd` 应回退到 loader 的当前工作目录。
     - 推荐合并形状：
       ```ts
       const config: AppConfig = {
         apiKey: env.CHATREALM_API_KEY ?? fileApiKey,
         baseUrl: env.CHATREALM_BASE_URL ?? fileBaseUrl,
         model: env.CHATREALM_MODEL ?? fileModel,
         cwd: env.CHATREALM_CWD ?? fileCwd ?? cwd,
       };
       ```
     - 返回这个 config object。
  8. 临时接入 `main.ts` 进行手动验证。
     - 导入 `loadConfig`。
     - 在解析 CLI args 并处理 help 之后，调用 `loadConfig()`。
     - 目前打印 parsed args 和 config。
     - 保持简单；TODO-011 会决定 CLI overrides 如何和 config 合并。
     - 示例临时输出形状：
       ```ts
       console.log(JSON.stringify({ args: parsed, config }, null, 2));
       ```
  9. 运行手动检查。
     - `npm run check`
     - `npm run dev -- --help`
     - `npm run dev -- -p "hello"`
     - 创建本地 `chatrealm.config.json`：
       ```json
       {
         "baseUrl": "https://example.test/v1",
         "model": "demo-model",
         "cwd": "."
       }
       ```
     - 运行 `npm run dev -- -p "hello"`，确认打印的 config 包含这些值。
     - 在 PowerShell 中测试环境变量 override：
       ```powershell
       $env:CHATREALM_MODEL = "env-model"
       npm run dev -- -p "hello"
       Remove-Item Env:\CHATREALM_MODEL
       ```
     - 确认 env var 设置期间 `model` 变成 `"env-model"`。
     - 使用无效 JSON 运行一次，确认错误清晰。
  10. 清理手动验证文件。
      - 如果 `chatrealm.config.json` 只是为了手动测试创建的，验证后删除它。
      - 不要提交本地 secrets。
- 初学者说明：
  - 环境变量是 shell 或操作系统提供的字符串。
  - 配置文件适合保存不想每次都输入的值。
  - 不要把真实 API keys 硬编码进源码或提交的配置文件。
  - `process.cwd()` 表示启动命令时所在的目录。
  - `resolve(cwd, "chatrealm.config.json")` 会得到预期配置文件的绝对路径。
  - `??` 表示“如果左边不是 `null` 或 `undefined`，就用左边；否则用右边”。
- 验收标准：
  - `npm run check` 成功。
  - 缺少 `chatrealm.config.json` 时不会崩溃。
  - 有效的 `chatrealm.config.json` 会被加载。
  - 环境变量会覆盖配置文件值。
  - `cwd` 始终有 string 值。
  - 无效 JSON 产生清晰错误。
  - string 字段出现非 string 配置值时产生清晰错误。
  - 本 TODO 不添加 LLM 调用、工具执行、session 或测试。
- Reviewer checklist：
  - 确认配置加载隔离在 `src/config/config.ts`。
  - 确认 JSON parsing helpers 隔离在 `src/utils/json.ts`。
  - 确认没有 `any`。
  - 确认没有提交 secrets。
  - 确认 `main.ts` 只是临时打印 config 用于验证，没有启动 agent 行为。

### TODO-004：定义 AI Transport 类型

- 状态：pending
- 目标：创建后续 OpenAI 兼容 provider、agent loop 和 tools 共享的 provider-neutral TypeScript 类型。
- 范围：
  - 创建 `src/ai/`。
  - 创建 `src/ai/types.ts`。
  - 定义 user、assistant、tool-result message 类型。
  - 定义 assistant 的普通文本内容和 tool call 内容。
  - 定义可以发送给模型的 tool definition 元数据。
  - 定义 provider request 和 response 类型。
  - 定义 usage 和 stop reason 类型。
  - 定义一个 TODO-005 可以实现的最小 transport interface。
  - 定义 streaming-ready event 类型，但暂不实现 streaming。
  - 暂不调用 provider、不执行工具、不构建 agent loop、不添加测试。
- 可能涉及的文件或区域：`src/ai/types.ts`
- 依赖：TODO-001、TODO-003
- 来自 `pi` 的参考：
  - `pi` 在 [packages/ai/src/types.ts](../packages/ai/src/types.ts) 里有更大的同类边界。
  - ChatRealm 保留同样的思想，但做小很多。
  - 这里最重要的不是类型数量，而是把 provider-neutral 应用代码和 provider-specific API 代码分开。
- 分步实现指南：
  1. 创建 AI 文件夹。

     - 创建 `src/ai/`。
     - 创建 `src/ai/types.ts`。
     - 这个文件只放导出的 TypeScript types 和 interfaces。
     - 不要在这个文件里写运行时 provider 代码。
  2. 添加一个小型 JSON value 类型。

     - Tool arguments 和 JSON schema object 需要表达未知 JSON 数据。
     - 不要使用 `any`。
     - 在 `src/ai/types.ts` 顶部附近添加这些类型：

       ```ts
       export type JsonPrimitive = string | number | boolean | null;

       export type JsonValue =
         | JsonPrimitive
         | JsonValue[]
         | { [key: string]: JsonValue };

       export type JsonObject = { [key: string]: JsonValue };
       ```
     - 为什么需要它：

       - LLM tool calls 通常会用 JSON 传递参数。
       - JSON 可以包含 string、number、boolean、null、array 和 object。
       - `JsonValue` 可以表达这个形状，同时避免退回到 `any`。
     - 初学者说明：

       - 这是递归类型。`JsonValue[]` 表示数组里的每一项也都是 JSON value。
       - `{ [key: string]: JsonValue }` 表示 object 的每个 key 都是 string，每个 value 也都是 JSON value。
  3. 定义基础文本内容。

     - 添加 `TextContent` interface：

       ```ts
       export interface TextContent {
         type: "text";
         text: string;
       }
       ```
     - 为什么需要 `type: "text"`：

       - 这是 discriminated union 的标签。
       - 后续代码可以检查 `content.type === "text"`，然后 TypeScript 就知道这个对象有 `text`。
       - Agent 代码经常使用这个模式，因为 message 里可能有不同种类的内容。
  4. 定义 tool-call 内容。

     - 添加 `ToolCallContent` interface：

       ```ts
       export interface ToolCallContent {
         type: "toolCall";
         id: string;
         name: string;
         arguments: JsonObject;
       }
       ```
     - 字段含义：

       - `id`：provider 生成或 adapter 生成的 ID，用来匹配后续 tool result。
       - `name`：tool 名称，例如 `read_file` 或 `search`。
       - `arguments`：已经解析好的 JSON object，后续会传给 tool。
     - 为什么 `arguments` 不是 `string`：

       - Provider API 经常把 tool arguments 作为 JSON string 返回。
       - TODO-005 的 provider adapter 应该解析这个 string。
       - ChatRealm 其他部分应该收到 typed object，而不是原始 JSON 文本。
  5. 把 assistant content 定义成 union。

     - 添加：

       ```ts
       export type AssistantContent = TextContent | ToolCallContent;
       ```
     - 含义：

       - Assistant response 可以包含普通文本。
       - 它也可以请求一个或多个工具。
       - TODO-010 的 agent loop 会检查这个 union，决定打印最终答案还是运行工具。
  6. 定义 usage 和 stop reason。

     - 添加：

       ```ts
       export interface Usage {
         inputTokens: number;
         outputTokens: number;
         totalTokens: number;
       }

       export type StopReason = "stop" | "length" | "toolUse" | "error";
       ```
     - 它们的含义：

       - `Usage` 记录 provider 返回的大致 token 数。
       - `stop` 表示 assistant 正常完成。
       - `length` 表示模型因为 token 限制停止。
       - `toolUse` 表示模型希望 agent 运行工具。
       - `error` 表示 adapter 创建了错误响应，而不是正常答案。
     - MVP 暂不做 cost 统计。
  7. 定义 message 类型。

     - 添加：

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
     - 为什么每个 message 都有字面量 `role`：

       - `role` 告诉后续代码这是哪种 message。
       - TypeScript 可以根据 `message.role` 缩小 union 类型。
       - 例如：执行 `if (message.role === "assistant")` 之后，TypeScript 就知道 `message.content` 是 `AssistantContent[]`。
     - 为什么 `usage` 和 `errorMessage` 显式写 `| undefined`：

       - 有些 provider 可能不返回 usage。
       - 正常响应没有 error message。
       - 这和前面 `ParsedArgs`、`AppConfig` 的风格一致。
  8. 定义 tool definition 元数据。

     - 添加：

       ```ts
       export interface ToolDefinition {
         name: string;
         description: string;
         parameters: JsonObject;
       }
       ```
     - `parameters` 是什么意思：

       - 它是一个类似 JSON schema 的 object，用来描述这个 tool 接受哪些参数。
       - 后续例子：read-file tool 可能声明自己需要一个 `path` string。
       - 本 TODO 不引入 JSON schema library。
     - 为什么它属于 `src/ai/types.ts`：

       - Model provider 需要 tool metadata，才能发送给 API。
       - TODO-006 的 tool registry 后续可以使用兼容的 metadata。
       - 这会形成 AI provider 代码和 tool 代码之间的契约。
  9. 定义 provider request 和 response 类型。

     - 添加：

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
     - 为什么需要 `ChatRequest`：

       - Agent loop 不应该知道 OpenAI 具体的 HTTP request 形状。
       - 它应该构建 provider-neutral 的 `ChatRequest`。
       - TODO-005 会把 `ChatRequest` 转换成 OpenAI 兼容 API payload。
     - 为什么 `tools` 永远是数组：

       - 空数组表示“没有可用工具”。
       - 这比同时处理 `undefined` 和 array 两种情况更简单。
  10. 定义 transport interface。

      - 添加：

        ```ts
        export interface ChatTransport {
          complete(request: ChatRequest): Promise<ChatResponse>;
        }
        ```
      - 什么是 transport：

        - 它是一个知道如何调用模型 provider 的对象。
        - Agent loop 可以调用 `transport.complete(request)`，而不需要知道 provider 是 OpenAI、本地 fake provider，还是其他东西。
        - TODO-005 会为一个 OpenAI 兼容 provider 实现这个 interface。
      - 为什么 `complete` 返回 `Promise`：

        - Provider 调用需要网络 I/O。
        - JavaScript 里的网络 I/O 是异步的。
        - `Promise<ChatResponse>` 表示这个函数未来会解析成一个 `ChatResponse`。
  11. 添加 streaming-ready event 类型。

      - MVP 暂不 streaming，但现在定义小型 event 类型可以让边界提前准备好。
      - 添加：

        ```ts
        export type ChatStreamEvent =
          | { type: "textDelta"; delta: string }
          | { type: "toolCall"; toolCall: ToolCallContent }
          | { type: "done"; response: ChatResponse }
          | { type: "error"; message: string };
        ```
      - 为什么这是 “streaming-ready”：

        - 后续 provider 可以在文本片段到达时逐段发出事件。
        - 程序其他部分可以处理 events，而不需要修改核心 message 类型。
        - 目前 TODO-005 可以暂时忽略这个类型。
  12. 检查完整预期的 `src/ai/types.ts`。

      - 一个完整的第一版可以长这样：

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
  13. 运行验证。

      - 运行 `npm run check`。
      - 如果 TypeScript 报未使用代码，记住导出的 types 即使暂时还没被 import，也可以存在。
      - 如果 checker 报语法错误，检查最近的 union type，确认每一行的 `|`、`{}` 和 `;` 都正确。
- 初学者说明：
  - type 文件描述形状；它不运行行为。
  - `interface` 适合描述 object 形状。
  - `type` 适合描述 union，例如 `"stop" | "length"`。
  - discriminated union 是一种 union，其中每个成员都有字面量标签字段，例如 `role` 或 `type`。
  - `unknown` 表示“我们还不信任这个值”；`JsonValue` 比 `unknown` 更具体，因为它把值限制在 JSON 兼容数据里。
  - `Promise<T>` 表示 async function 未来会产生 `T`。
- 验收标准：
  - `src/ai/types.ts` 存在。
  - `npm run check` 成功。
  - 文件导出了 provider-neutral 的 message、content、tool、usage、request、response、transport 和 stream-event types。
  - 暂不添加 provider-specific HTTP payload 类型。
  - 暂不添加运行时 provider 调用。
  - 不使用 `any`。
  - 不添加新的 runtime dependency。
- Reviewer checklist：
  - 确认 AI 边界没有导入 OpenAI-specific types。
  - 确认 tool-call arguments 使用 `JsonObject`，不是 `any`。
  - 确认 assistant text 和 tool-call content 可以通过 `type` 区分。
  - 确认 messages 可以通过 `role` 区分。
  - 确认 TODO-005 可以在不修改这些类型的情况下实现 `ChatTransport`。

### TODO-005：实现 OpenAI 兼容 Provider

- 状态：completed
- 目标：实现一个真实 provider adapter，满足 TODO-004 里的 `ChatTransport` interface，并能调用 OpenAI 兼容的 `/chat/completions` API。
- 范围：
  - 创建 `src/ai/openai-compatible.ts`。
  - 使用 `src/ai/types.ts` 中的 provider-neutral 类型。
  - 把 user、assistant、tool-result messages 发送给 OpenAI 兼容 API。
  - 使用 OpenAI 的 `tools` 格式发送可选 tool definitions。
  - 把 provider response 转回 `ChatResponse`。
  - 解析 assistant 普通文本回复。
  - 解析 assistant tool calls，并把 tool-call arguments 转成 `JsonObject`。
  - 对缺失 API key、HTTP 失败、无效 JSON、畸形 provider response 添加清晰错误。
  - 暂不构建 agent loop。
  - 暂不执行任何 tools。
  - 暂不添加 streaming。
  - 暂不添加测试，除非你想额外练习；TODO-014 负责正式测试。
- 可能涉及的文件或区域：`src/ai/openai-compatible.ts`、`src/config/config.ts`
- 依赖：TODO-003、TODO-004
- 来自 `pi` 的参考：
  - `pi` 在 [packages/ai/src/providers/](../packages/ai/src/providers/) 下有更大的 provider layer。
  - ChatRealm 不要复制完整 registry。
  - MVP 要学的是边界：app code 使用 `ChatTransport`，provider code 知道 OpenAI 兼容的 wire format。
- 初学者心智模型：
  - `ChatTransport` 是你的 app 内部形状。
  - OpenAI 兼容 chat completions 是 provider 的 HTTP 形状。
  - `openai-compatible.ts` 就是这两个世界之间的翻译器。
  - ChatRealm 其他部分不应该需要知道 OpenAI 的具体 JSON 字段名。
- 分步实现指南：
  1. 创建 provider 文件。
     - 创建 `src/ai/openai-compatible.ts`。
     - 这个文件放运行时代码，不同于 `src/ai/types.ts`，后者只放类型。
     - 只使用顶部 imports：

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
     - 为什么使用 `import type`：

       - 这些 imports 只用于 TypeScript 类型。
       - 它们在运行时会消失。
       - 这样可以让生成的 JavaScript 更小，也避免意外的运行时依赖。
     - imports 保持在文件顶部。不要使用 dynamic imports。
  2. 定义 provider options。
     - 添加一个导出的 interface，名为 `OpenAICompatibleOptions`。
     - 推荐形状：

       ```ts
       export interface OpenAICompatibleOptions {
         apiKey: string;
         baseUrl?: string;
       }
       ```
     - `apiKey` 必填，因为 provider 没有它就无法调用 API。
     - `baseUrl` 可选，因为 provider 可以默认使用官方 OpenAI base URL。
     - 这个 MVP 不要把 `model` 放在这里。model 来自 `ChatRequest.model`。
  3. 添加默认 base URL。
     - 在文件顶部附近添加：

       ```ts
       const DEFAULT_BASE_URL = "https://api.openai.com/v1";
       ```
     - 这样普通 OpenAI 用户只需要配置 `apiKey`。
     - 使用兼容服务的用户仍然可以传入自定义 `baseUrl`。
  4. 定义最小 raw provider response 类型。
     - 这些类型只描述 ChatRealm 需要从 HTTP response 中读取的字段。
     - 不要建模完整 OpenAI API。
     - 推荐类型：

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
     - 为什么字段都是可选的：

       - 外部 HTTP response 不可信。
       - 可选字段会强迫代码在使用前检查。
       - 这比假设网络永远返回精确形状更安全。
  5. 实现 transport class。
     - 添加一个 class，实现 `ChatTransport`。
     - 推荐骨架：

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
     - 为什么这里适合用 class：

       - API key 和 base URL 是初始化时的设置值。
       - `complete` 可以在每次请求时重复使用它们。
       - 后续测试时，你可以把这个 transport 换成 fake transport。
  6. 添加一个小 URL helper。
     - 在 class 下方或上方添加：

       ```ts
       function trimTrailingSlash(value: string): string {
         return value.endsWith("/") ? value.slice(0, -1) : value;
       }
       ```
     - 为什么需要它：

       - 用户可能配置带结尾斜杠的 `https://api.openai.com/v1/`。
       - provider 会追加 `/chat/completions`。
       - 去掉结尾斜杠可以避免 `https://api.openai.com/v1//chat/completions`。
  7. 构造 HTTP request body。
     - 在 `complete` 内创建一个发送给 OpenAI 兼容 API 的普通对象：

       ```ts
       const body = {
         model: request.model,
         messages: toOpenAIMessages(request),
         tools: request.tools.length > 0 ? request.tools.map(toOpenAITool) : undefined,
       };
       ```
     - `messages` 字段必须使用 OpenAI 的 roles 和 content 格式。
     - 没有 tools 时应省略 `tools` 字段。
     - 这个 TODO 不添加 streaming 字段。
     - 不要在这里执行 tool；这个文件只发送 tool definitions，并接收模型提出的 tool-call requests。
  8. 使用 `fetch` 发送 HTTP request。
     - Node 18+ 有全局 `fetch`，这个 MVP 不需要额外 runtime dependency。
     - 推荐代码形状：

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
     - Header 说明：

       - `authorization` 携带 API key。
       - `content-type` 告诉服务器 body 是 JSON。
       - Header 名字大小写不敏感，所以小写可以。
  9. 处理 HTTP errors。
     - 如果 `response.ok` 是 false，读取 response text 并抛出清晰错误。
     - 推荐代码形状：

       ```ts
       if (!response.ok) {
         const errorText = await response.text();
         throw new Error(
           `OpenAI-compatible request failed with ${response.status}: ${errorText}`,
         );
       }
       ```
     - 这样你能看出问题是 invalid key、bad base URL、bad model，还是 provider-side error。
     - 不要吞掉 HTTP error 并返回 assistant message；HTTP 失败不是正常 assistant response。
  10. 解析 JSON response。
      - 先把 response body 读成 text。
      - 使用 `parseJsonObject`，这样无效 JSON 会产生清晰错误。
      - 推荐代码形状：

        ```ts
        const responseText = await response.text();
        const json = parseJsonObject(responseText, "OpenAI-compatible response");
        ```
      - 然后在 helper 检查后，把 `json` 转成 `OpenAIChatCompletionResponse`。
      - 避免 `any`；使用 `unknown`、`Record<string, unknown>` 和小 helper functions。
      - 为什么这一步不能只有 `JSON.parse`：

        - `JSON.parse` 只能告诉你文本是不是合法 JSON。
        - 它不能告诉你这个 JSON 是否符合 provider 期望的形状。
        - Provider response 可能是合法 JSON，但仍然不能用，例如 `{ "error": "bad model" }`。
        - 这一步应该在后续代码读取字段前，先拒绝畸形的成功 response。
      - 不要这样写：

        ```ts
        const data = await response.json() as OpenAIChatCompletionResponse;
        ```
      - 为什么不要这样写：

        - `response.json()` 返回的是不可信外部数据。
        - `as OpenAIChatCompletionResponse` 只是告诉 TypeScript“相信我”。
        - 它不会做任何运行时检查。
        - 如果 response 形状不对，代码可能会在后面用很难懂的错误崩掉。
      - 使用更安全的流程：

        1. 读取 response text。
        2. 使用 `parseJsonObject` 解析。
        3. 验证 provider 需要的字段。
        4. 返回一个后续步骤可用的小型 typed object。
      - 添加一个识别普通 object 的 helper：

        ```ts
        function isRecord(value: unknown): value is Record<string, unknown> {
          return (
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value)
          );
        }
        ```
      - 为什么需要 `isRecord`：

        - TypeScript 不能安全地从 `unknown` 上读取 `value.choices`。
        - 当 `isRecord(value)` 返回 true 后，TypeScript 才知道 `value` 像 object。
        - 但它仍然不会信任每个具体字段；每个字段还需要单独检查。
      - 添加一个验证 top-level response 的 helper：

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
      - 这个 helper 检查什么：

        - `choices` 必须存在。
        - `choices` 必须是 array。
        - `choices` 里的每一项交给另一个 helper 继续验证。
        - `usage` 是可选字段，所以可以单独转换。
      - 添加一个验证每个 choice 的 helper：

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
      - 为什么把 choice validation 单独拆出来：

        - top-level response 只知道 `choices` 是 array。
        - array 里的每一项仍然需要自己的检查。
        - 小 helper 会让 TypeScript 报错更容易理解。
      - 添加几个小的 value helpers：

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
      - 为什么这些 helpers 故意比较通用：

        - 它们能避免反复写同样的 `typeof` 检查。
        - 它们能让 response parser 更容易读。
        - 这个 MVP 暂时不需要每个字段都有完全独立的错误消息。
      - 添加 usage helper：

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
      - 添加 tool-call list helper：

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
      - 添加单个 tool-call helper：

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
      - 有了这些 helpers 后，`complete` 里的 Step 10 可以长这样：

        ```ts
        const responseText = await response.text();
        const json = parseJsonObject(responseText, "OpenAI-compatible response");
        const data = toOpenAIChatCompletionResponse(json);
        ```
      - 后续步骤就可以使用 `data.choices` 和 `data.usage`，不用再反复解析原始 JSON。
      - 初学者检查点：

        - 如果 TypeScript 说某个值是 `unknown`，先加运行时检查，再读它的属性。
        - 如果 TypeScript 说 `unknown` 上不存在某个 property，多半是忘了用 `isRecord`。
        - 如果 TypeScript 说返回类型不匹配，检查是不是在 interface 期待 `undefined` 的地方返回了 `null`。
        - 如果 helper 过早 throw，把真实 provider JSON 和 Step 4 中的最小 raw response types 对照一下。
      - 不要这样做：

        - 不要使用 `any`。
        - 不要不验证就相信 `response.json()`。
        - 不要在 Step 10 里解析 tool-call `arguments`；Step 14 负责 assistant content parsing。
        - 不要在 Step 10 里转换成 `ChatResponse`；Step 13 负责这个转换。
        - 不要在这里 catch 后隐藏畸形 response 错误，除非你重新抛出清晰错误。
  11. 把 ChatRealm messages 转成 OpenAI messages。
      - 添加 helper，名为 `toOpenAIMessages`。
      - 它应该：

        - 如果 `request.systemPrompt` 存在，先添加 system message。
        - 把 user message 转成 `{ role: "user", content: message.content }`。
        - 把 assistant text 和 tool-call content 转成一个 assistant message。
        - 把 tool-result message 转成 `{ role: "tool", tool_call_id, content }`。
      - 初学者友好的第一版：

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
      - 然后添加 `toOpenAIMessage(message: Message): JsonObject`。
      - 保持 helper 小，用 `switch (message.role)`。
      - 这个 TODO 不支持 image messages 或 streaming chunks。
  12. 把 tools 转成 OpenAI tool definitions。
      - 添加 helper，名为 `toOpenAITool`。
      - 推荐形状：

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
      - 这是把 ChatRealm 的 provider-neutral `ToolDefinition` 转成 OpenAI 的 function-tool 格式。
      - provider 不执行 tool。它只告诉模型有哪些 tools 可用。
  13. 把 provider response 转成 `ChatResponse`。
      - 正常路径是：

        - 取第一个 choice。
        - 读取 `choice.message.content`。
        - 读取 `choice.message.tool_calls`。
        - 转成 `AssistantContent[]`。
        - 转换 usage。
        - 转换 finish reason。
        - 返回 `{ message }`。
      - 推荐最终形状：

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
      - 如果 response 没有 choices 或没有 message，抛出清晰错误。
  14. 解析 assistant content。
      - 如果 `content` 是非空 string，添加：

        ```ts
        { type: "text", text: content }
        ```
      - 如果存在 `tool_calls`，把每个 function tool call 转成：

        ```ts
        {
          type: "toolCall",
          id: toolCall.id,
          name: toolCall.function.name,
          arguments: parsedArguments,
        }
        ```
      - `toolCall.function.arguments` 是 JSON string，不是 object。
      - 使用 `parseJsonObject(argumentsText, "tool call arguments")` 解析它。
      - 缺少 `id`、缺少 `name` 或 arguments 无效，都应该视为畸形 provider response。
  15. 转换 finish reasons。
      - 添加 helper，名为 `toStopReason`。
      - 推荐映射：

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
      - OpenAI 使用 `"tool_calls"`；ChatRealm 使用 `"toolUse"`。
      - 这个 helper 可以避免 provider-specific 命名进入 app 其他部分。
  16. 转换 usage。
      - 添加 helper，名为 `toUsage`。
      - 如果 usage 缺失，返回 `undefined`。
      - 否则映射：
        - `prompt_tokens` 到 `inputTokens`
        - `completion_tokens` 到 `outputTokens`
        - `total_tokens` 到 `totalTokens`
      - 如果某个 number 缺失，这个 MVP 里使用 `0`。
  17. 添加一个小 factory function。
      - 在文件底部添加：

        ```ts
        export function createOpenAICompatibleTransport(
          options: OpenAICompatibleOptions,
        ): ChatTransport {
          return new OpenAICompatibleTransport(options);
        }
        ```
      - 这会让 TODO-011 的 wiring 更容易。
      - app 其他部分可以调用函数，而不是直接使用 `new`。
  18. 运行类型检查。
      - 从 `ChatRealm/` 运行：

        ```powershell
        npm run check
        ```
      - 进入下一步前修复所有 TypeScript 错误。
      - 常见修复：

        - 如果 `fetch` 未知，确认 TypeScript `lib` 包含现代环境，或者安装/更新 Node types。
        - 如果 `JsonObject` 拒绝某个值，检查嵌套值是否都是 JSON-compatible。
        - 如果 TypeScript 要求返回值，确认每个 helper 都 return 或 throw。
  19. 可选手动 smoke test。
      - 这个 TODO 不需要完整 CLI wiring。
      - 如果你想手动测试 provider，可以创建不提交的临时脚本，或者等 TODO-011。
      - 不要提交 API keys 或本地 smoke-test 文件。
- 初学者说明：
  - `fetch` 发送 HTTP request。
  - `await` 会暂停，直到网络 response 返回。
  - `JSON.stringify(body)` 把 JavaScript object 转成 HTTP request 里的 JSON 文本。
  - `response.ok` 在 HTTP 2xx 成功状态下为 true。
  - Provider response 是外部数据，所以使用字段前要验证。
  - Tool calls 是模型提出的请求，不是 tool results。
  - Tool execution 会在后续 agent loop 里发生。
- 验收标准：
  - `src/ai/openai-compatible.ts` 存在。
  - 它导出 `OpenAICompatibleTransport` 或返回 `ChatTransport` 的 factory。
  - 它向 `${baseUrl}/chat/completions` 发送请求。
  - 它包含 authorization bearer token。
  - 它把 ChatRealm messages 转成 OpenAI-compatible messages。
  - 它把 ChatRealm tool definitions 转成 OpenAI-compatible function tools。
  - 它返回带 `AssistantMessage` 的 `ChatResponse`。
  - 它支持普通文本 assistant responses。
  - 它支持带已解析 JSON arguments 的 assistant tool calls。
  - 它把 usage 映射成 `Usage | undefined`。
  - 它把 provider finish reasons 映射成 `StopReason`。
  - HTTP failures 和畸形 responses 会产生清晰错误。
  - `npm run check` 成功。
  - 这个 TODO 不实现 agent loop、tool execution、session persistence 或 streaming。
- Reviewer checklist：
  - 确认 provider-specific JSON shapes 只在 `src/ai/openai-compatible.ts`。
  - 确认 `src/ai/types.ts` 保持 provider-neutral。
  - 确认没有 `any`。
  - 确认没有 dynamic imports。
  - 确认 API keys 来自 config 或 options，而不是 hardcoded。
  - 确认 tool calls 只是被解析并返回，没有被执行。

### TODO-006：定义 Tool Contracts 和 Registry

- 状态：pending
- 目标：创建 provider-neutral 的工具边界，让后续 TODO 可以把真实工具接进来。
- 范围：
  - 创建 `src/tools/`。
  - 创建 `src/tools/types.ts`。
  - 创建 `src/tools/registry.ts`。
  - 定义 tool runtime implementation 的形状。
  - 复用 `src/ai/types.ts` 里的 `ToolDefinition` 和 `JsonObject`。
  - 添加 registry，让它可以注册工具、列出 model 可见的 tool definitions，并按名称查找工具。
  - 为非法工具名和重复注册添加清晰错误。
  - 还不要实现 read-file、search、write-file 或 shell 工具。
  - 还不要执行 model 请求的 tool calls。
  - 还不要构建 agent loop。
- 可能涉及的文件或区域：`src/tools/types.ts`、`src/tools/registry.ts`
- 依赖：TODO-004
- 参考 `pi`：
  - `pi` 在 [packages/coding-agent/src/core/tools/](../packages/coding-agent/src/core/tools/) 下有更大的 tool system。
  - ChatRealm 不应该复制完整实现。
  - MVP 要学习的是边界：model 看到 `ToolDefinition`；agent 运行内部的 `AgentTool`。
- 新手心智模型：
  - 一个工具有两面。
  - model 可见的一面是 metadata：name、description 和 JSON schema parameters。
  - runtime 的一面是 code：一个接收 parsed JSON arguments 的 `execute` 函数。
  - registry 只是从 tool name 到 tool implementation 的 lookup table。
  - TODO-006 只构建这张表和 contracts。TODO-007 和 TODO-008 再添加真实工具。
- 分步实现指南：
  1. 创建 tools 文件夹。

     - 创建 `src/tools/`。
     - 创建 `src/tools/types.ts`。
     - 创建 `src/tools/registry.ts`。
     - 这个 TODO 不放具体工具实现。
  2. 在 `src/tools/types.ts` 中导入共享 AI 类型。

     - 添加 top-level type imports：

       ```ts
       import type {
         JsonObject,
         ToolDefinition,
       } from "../ai/types.js";
       ```
     - 为什么这些来自 `src/ai/types.ts`：

       - `ToolDefinition` 是 provider 发送给 model 的内容。
       - `JsonObject` 是 parsed tool arguments 的安全形状。
       - 复用它们可以连接 AI 边界和 tool 边界，同时避免重复定义类型。
  3. 定义 tool execution context。

     - 导出名为 `ToolContext` 的 interface。
     - 推荐第一版形状：

       ```ts
       export interface ToolContext {
         cwd: string;
       }
       ```
     - `cwd` 是工具应该工作的目录。
     - 现在不要加入 session state、config、logging、approvals 或 UI。
     - 后续 TODO 可以在真实需求出现时扩展这个 context。
  4. 定义 tool result type。

     - 导出名为 `ToolResult` 的 interface。
     - 推荐形状：

       ```ts
       export interface ToolResult {
         content: string;
         isError: boolean;
       }
       ```
     - 含义：

       - `content` 是后续会发送回 model 的文本。
       - `isError` 告诉 agent loop 这个工具是成功还是失败。
     - MVP 阶段保持 text-only result。
     - 现在不要添加 binary output、images、streaming events 或 rich rendering。
  5. 定义内部 tool interface。

     - 导出名为 `AgentTool` 的 interface。
     - 推荐形状：

       ```ts
       export interface AgentTool {
         definition: ToolDefinition;
         execute(args: JsonObject, context: ToolContext): Promise<ToolResult>;
       }
       ```
     - 为什么这个形状合适：

       - `definition` 会放进 `ChatRequest.tools` 发给 model。
       - `execute` 后续由 agent loop 在 model 请求工具时调用。
       - `args` 已经是 JSON object，因为 TODO-005 会解析 tool-call arguments。
       - `context` 给工具当前工作目录，而不是依赖全局变量。
  6. 在 `src/tools/registry.ts` 中添加 imports。

     - 添加：

       ```ts
       import type { ToolDefinition } from "../ai/types.js";
       import type { AgentTool } from "./types.js";
       ```
     - 保持 type imports。
     - `registry.ts` 不应该 import provider code 或 agent-loop code。
  7. 实现 `ToolRegistry` class。

     - 导出名为 `ToolRegistry` 的 class。
     - 用 private `Map<string, AgentTool>` 存储工具。
     - 推荐 skeleton：

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
     - 为什么这里适合用 class：

       - registry 有内部状态。
       - 它可以在一个地方强制执行重复名称规则。
       - 后续 TODO 可以把 registry 传进 agent loop。
  8. 添加 `register`。

     - 添加一个 method，校验工具名并存储工具。
     - 推荐形状：

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
     - 为什么 validation 属于 registry：

       - 重复名称会让后续 lookup 变得 ambiguous。
       - 空名称不能被 model 调用。
       - 每个具体工具都不应该重复实现 registry rules。
  9. 添加 lookup methods。

     - 添加 `get(name: string): AgentTool | undefined`。
     - 添加 `require(name: string): AgentTool`。
     - 推荐形状：

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
     - 为什么两个 method 都需要：

       - `get` 适合 absence 被允许的场景。
       - `require` 适合 absence 是错误的场景。
       - TODO-010 在执行 model 请求的 tool call 时可以用 `require`。
  10. 添加 list methods。

      - 添加 `list(): AgentTool[]`。
      - 添加 `definitions(): ToolDefinition[]`。
      - 推荐形状：

        ```ts
        list(): AgentTool[] {
          return [...this.tools.values()];
        }

        definitions(): ToolDefinition[] {
          return this.list().map((tool) => tool.definition);
        }
        ```
      - `definitions()` 是通往 `ChatRequest.tools` 的桥。
      - provider 应该接收 definitions，而不是完整的 executable tool objects。
      - 返回新数组可以避免调用方修改 registry 内部的 `Map`。
  11. 添加一个小 factory function。

      - 导出名为 `createToolRegistry` 的函数。
      - 推荐形状：

        ```ts
        export function createToolRegistry(tools: AgentTool[] = []): ToolRegistry {
          return new ToolRegistry(tools);
        }
        ```
      - 这会让后续 wiring 更简单。
      - TODO-011 如果偏好 factory functions，可以不直接使用 `new`。
  12. 检查完整预期的 `src/tools/types.ts`。

      - 第一版完整代码可以像这样：

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
  13. 检查完整预期的 `src/tools/registry.ts`。

      - 第一版完整代码可以像这样：

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
  14. 可选：用 fake tool 做手动检查。

      - 这个 TODO 不需要测试框架。
      - 如果想增加信心，可以创建一个临时本地 scratch file，检查完后删除。
      - fake tool 应该：
        - 有 `definition.name`。
        - 返回 `{ content: "ok", isError: false }`。
        - 被注册进 `ToolRegistry`。
        - 能从 `definitions()` 里看到。
      - 不要提交 scratch files。
  15. 运行类型检查。

      - 从 `ChatRealm/` 运行：

        ```powershell
        npm run check
        ```
      - 移动到下一步前修复所有 TypeScript 错误。
      - 常见修复：

        - 如果 TypeScript 找不到 `../ai/types.js`，检查从 `src/tools/` 出发的相对路径。
        - 如果某个 import 只作为类型使用，用 `import type`。
        - 如果 `execute` 返回普通 `ToolResult`，把函数写成 `async` 或返回 `Promise.resolve(...)`。
        - 如果 `JsonObject` 拒绝 schema，确认 schema 的每个值都是 JSON-compatible。
- 新手 notes：
  - `ToolDefinition` 给 model 看。
  - `AgentTool` 给你的程序用。
  - `ToolRegistry` 把 tool name 连接到 `AgentTool`。
  - JSON schema metadata 描述预期参数；MVP 阶段它本身不会执行，也不会自动验证。
  - read/search/write/shell arguments 的实际字段校验属于后续具体工具。
  - 保持 tool execution 不进入 provider。provider 只返回 tool-call requests。
- 验收标准：
  - `src/tools/types.ts` 存在。
  - `src/tools/registry.ts` 存在。
  - 导出 `ToolContext`、`ToolResult` 和 `AgentTool`。
  - `ToolRegistry` 可以注册 tools。
  - 重复 tool names 会抛出清晰错误。
  - 空 tool names 会抛出清晰错误。
  - `get` 可以返回 tool 或 `undefined`。
  - `require` 返回 tool，或抛出清晰 unknown-tool error。
  - `definitions()` 只返回 `ToolDefinition[]`。
  - 还没有添加 read/search/write/shell tool implementation。
  - 还没有添加 agent loop 或 tool execution flow。
  - 从 `ChatRealm/` 运行 `npm run check` 成功。
- Reviewer checklist：
  - 确认 tool contracts 保持 provider-neutral。
  - 确认复用 `src/ai/types.ts`，而不是重复定义。
  - 确认没有使用 `any`。
  - 确认没有 dynamic imports。
  - 确认 registry lookup 基于 `definition.name`。
  - 确认具体工具行为仍然延后到 TODO-007 和 TODO-008。

### TODO-007：实现读取和搜索工具

- 状态：pending
- 目标：添加第一批真实工具：一个读取 text file 的工具，一个在当前工作目录下搜索 text files 的工具。
- 范围：
  - 创建 `src/tools/path.ts`，用于共享 cwd confinement。
  - 创建 `src/tools/read-file.ts`。
  - 创建 `src/tools/search.ts`。
  - 更新 `src/tools/registry.ts`，让调用方可以创建包含这些工具的 default registry。
  - 在 tool boundary 校验 tool arguments。
  - 保证每次 file access 都在 `ToolContext.cwd` 内部。
  - 返回简洁的 `ToolResult` objects。
  - 还不要实现 write-file 或 shell tools。
  - 还不要构建 agent loop。
  - 还不要添加外部 search dependencies。
- 可能涉及的文件或区域：`src/tools/path.ts`、`src/tools/read-file.ts`、`src/tools/search.ts`、`src/tools/registry.ts`
- 依赖：TODO-006
- 参考 `pi`：
  - `pi` 在 [packages/coding-agent/src/core/tools/](../packages/coding-agent/src/core/tools/) 下有更丰富的 file tools。
  - ChatRealm 应保持更小：读取文本文件、搜索文本文件，并强制 cwd confinement。
  - MVP 要学习的是安全的 local tool execution，不是完整 shell-like filesystem behavior。
- 新手心智模型：
  - model 通过 name 和 JSON arguments 请求一个工具。
  - registry 找到对应的 `AgentTool`。
  - tool 校验 arguments，访问 filesystem，然后返回文本。
  - tool 不应该信任 model 提供的 path。
  - `cwd` 是安全边界：工具可以在里面工作，但不能通过 `../` 逃出去。
- 开始前：
  - 检查 `src/tools/types.ts`。
  - 如果你的 `AgentTool` method 名叫 `excute`，先把它改成 `execute` 再继续。
  - TODO-006 预期 interface 是：

    ```ts
    export interface AgentTool {
      definition: ToolDefinition;
      execute(args: JsonObject, context: ToolContext): Promise<ToolResult>;
    }
    ```
  - 拼写很重要，因为 TODO-010 会调用 `tool.execute(...)`。
- 分步实现指南：
  1. 创建共享 path helper。

     - 创建 `src/tools/path.ts`。
     - 导入 Node path helpers：

       ```ts
       import { isAbsolute, relative, resolve } from "node:path";
       ```
     - 添加名为 `resolveInsideCwd` 的函数。
     - 推荐形状：

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
     - 为什么需要它：

       - model 提供的 path 不可信。
       - `../secret.txt` 不应该逃出项目。
       - MVP 阶段不接受 absolute paths。
       - read-file 和 search 都需要同一个安全规则。
  2. 添加一个小的 required-string reader。

     - 现在可以先把这个 helper 放在每个 tool file 里。
     - 推荐形状：

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
     - 这个 helper 故意保持简单。
     - 现在不要添加完整 JSON schema validator。
     - JSON schema metadata 帮助 model 选择参数，但这个 helper 才是 runtime check。
  3. 创建 `src/tools/read-file.ts`。

     - 从 `node:fs/promises` 导入 `readFile`。
     - 导入 `AgentTool`。
     - 导入 `resolveInsideCwd`。
     - 推荐 imports：

       ```ts
       import { readFile } from "node:fs/promises";
       import type { JsonObject } from "../ai/types.js";
       import type { AgentTool } from "./types.js";
       import { resolveInsideCwd } from "./path.js";
       ```
  4. 定义 read-file tool metadata。

     - 导出名为 `readFileTool` 的常量。
     - 推荐 definition：

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
     - 保持 name 稳定：`read_file`。
     - 这个 name 是 model 后续 tool call 会请求的名字。
  5. 实现 `read_file`。

     - 在 `execute` 里使用 `try/catch`。
     - 读取并校验 `path`。
     - 通过 `resolveInsideCwd` 解析路径。
     - 按 UTF-8 读取文件。
     - 成功时返回 text，失败时返回 error result。
     - 推荐形状：

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
     - 为什么 tool 返回 errors，而不是总是 throw：

       - 工具失败对 model 来说是有用信息。
       - 文件不存在、权限错误、非法路径，后面都应该变成 tool-result messages。
       - 真正的 programmer errors 仍然可以在预期执行路径之外 throw。
  6. 创建 `src/tools/search.ts`。

     - MVP search 应该是简单 text search，不是 regex search。
     - 在一个 relative directory 下递归搜索。
     - 跳过大型 dependency/build folders。
     - 推荐 imports：

       ```ts
       import { readdir, readFile } from "node:fs/promises";
       import { relative } from "node:path";
       import type { JsonObject } from "../ai/types.js";
       import type { AgentTool } from "./types.js";
       import { resolveInsideCwd } from "./path.js";
       ```
  7. 定义 search tool metadata。

     - 导出名为 `searchTool` 的常量。
     - 推荐参数：

       - `query`：required string。
       - `path`：optional relative directory path，默认 `"."`。
       - `maxResults`：optional number，默认 `50`。
     - 推荐 definition：

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
  8. 为 search 添加小的 argument readers。

     - `query` 复用 `readRequiredString`。
     - 添加 optional readers：

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
     - 现在先保持 local helper。
     - 只有当重复真的让你难受时，再提取共享 argument helpers。
  9. 添加 skipped-directory set。

     - 在 `search.ts` 顶部附近添加：

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
     - 这样 search 更快，输出也更少噪音。
     - 现在不要添加 `.env` 特殊处理；这个 TODO 只需要 path safety 和 concise output。
  10. 实现 recursive search。

      - 保持简单。
      - 使用 `readdir(directory, { withFileTypes: true })`。
      - 遇到 directory 时递归，除非它在 skip list 里。
      - 尝试按 UTF-8 读取 files。
      - 读不了的文件直接跳过。
      - 可以用 helper 收集 string results：

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
      - 这里用 `resolveInsideCwd(directory, entry.name)` 处理 child paths。
      - 因为 `directory` 已经被解析到原始 cwd 内部，所以这是可以接受的。
      - 如果你觉得这点绕，也可以从 `node:path` 导入 `resolve`，然后用 `resolve(directory, entry.name)`。
  11. 实现 file matching。

      - 把文件内容按行拆开。
      - 每个 match 添加一行 output。
      - 推荐 output format：

        ```text
        relative/path.ts:12: matched line text
        ```
      - 推荐 helper：

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
      - 这是 plain text search。
      - 这个 TODO 不添加 regex、ignore files、glob syntax、ranking 或 fuzzy search。
  12. 实现 `search.execute`。

      - 校验 arguments。
      - 通过 `resolveInsideCwd` 解析 search directory。
      - 把 `maxResults` 限制在合理范围。
      - 没有 match 时返回简洁消息。
      - 推荐形状：

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
  13. 更新 `src/tools/registry.ts`。

      - 导入新工具：

        ```ts
        import { readFileTool } from "./read-file.js";
        import { searchTool } from "./search.js";
        ```
      - 添加 default registry factory：

        ```ts
        export function createDefaultToolRegistry(): ToolRegistry {
          return createToolRegistry([readFileTool, searchTool]);
        }
        ```
      - 保留 TODO-006 里的 generic `ToolRegistry` 和 `createToolRegistry`。
      - 现在不要注册 write 或 shell tools。
  14. 运行类型检查。

      - 从 `ChatRealm/` 运行：

        ```powershell
        npm run check
        ```
      - 移动到下一步前修复所有 TypeScript 错误。
      - 常见修复：

        - 如果 Node built-in imports 失败，检查 `@types/node` 和 `tsconfig.json`。
        - 如果 `JsonObject` 拒绝 JSON schema，记住 schema values 必须 JSON-compatible。
        - 如果 TypeScript 说 `execute` 不存在，检查 TODO-006 里是否有 `excute` 拼写错误。
        - 如果 Windows 上 `relative` output 看起来不对，用 `ChatRealm/` 内的简单文件测试。
  15. 可选手动 smoke check。

      - 这不是正式 test suite。
      - 它只是一个快速检查，用来在 agent loop 出现前证明 tools 能工作。
      - 在 `ChatRealm/` root 下创建一个临时文件 `tool-smoke.ts`。
      - 不要提交这个文件。
      - 添加下面的脚本：

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
      - 从 `ChatRealm/` 运行：

        ```powershell
        npm exec tsx -- ./tool-smoke.ts
        ```
      - 预期输出：

        ```text
        tool smoke ok
        ```
      - 这个 smoke check 证明：

        - default registry 包含两个 tools。
        - `read_file` 可以读取 `package.json`。
        - `search` 可以在项目文件里找到文本。
        - `read_file` 会拒绝 `../` path escape。
      - 如果失败：

        - 如果 TypeScript 说 `execute` 不存在，修复 `src/tools/types.ts` 里的 `excute` typo。
        - 如果 imports 失败，检查文件名和 `.js` import suffix 是否匹配。
        - 如果 path escape 没有失败，检查 `resolveInsideCwd`。
        - 如果 search output 太多，降低 `maxResults`。
      - 最后删除 scratch file：

        ```powershell
        Remove-Item .\tool-smoke.ts
        ```
- 新手 notes：
  - Path normalization 是把 `src/../package.json` 这样的用户路径转成 canonical path。
  - Cwd confinement 是拒绝逃出项目根目录的路径。
  - Tool error 仍然是有效 tool result；它能帮助 model 恢复。
  - `read_file` 现在可以返回整个文件。
  - `search` 应返回简洁 matching lines，而不是整个文件。
  - 保持 search 无聊且可预测；更好的 search 可以以后再做。
- 验收标准：
  - `src/tools/path.ts` 存在，并阻止 absolute paths 和 `../` escapes。
  - `src/tools/read-file.ts` 导出 `readFileTool`。
  - `src/tools/search.ts` 导出 `searchTool`。
  - `read_file` 接受 `path` 参数。
  - `read_file` 在 `cwd` 内读取 UTF-8 text。
  - `search` 接受 `query`、optional `path` 和 optional `maxResults`。
  - `search` 在 `cwd` 内递归搜索。
  - `search` 跳过常见 dependency/build folders。
  - Tool failures 返回 `{ isError: true }` 和清晰消息。
  - `createDefaultToolRegistry()` 包含 `readFileTool` 和 `searchTool`。
  - 还没有添加 write-file 或 shell command tool。
  - 还没有添加 agent loop。
  - 从 `ChatRealm/` 运行 `npm run check` 成功。
- Reviewer checklist：
  - 确认 model-provided paths 不能逃出 `ToolContext.cwd`。
  - 确认 filesystem access 前已做 tool argument validation。
  - 确认输出足够简洁，可以发送回 model。
  - 确认没有使用 `any`。
  - 确认没有 dynamic imports。
  - 确认 TODO-008 仍然负责 write 和 shell tools。

### TODO-008：实现写入和 Shell 工具

- 状态：pending
- 目标：添加第一批会改变本地状态的工具：写文件和运行 shell command。
- 范围：

  - 创建 `src/tools/write-file.ts`。
  - 创建 `src/tools/shell.ts`。
  - 复用 `src/tools/path.ts` 里的 `resolveInsideCwd`。
  - 更新 `src/tools/registry.ts`，让 default registry 包含 read、search、write 和 shell tools。
  - 在执行 filesystem 或 shell 操作前校验 tool arguments。
  - 保证 file writes 在 `ToolContext.cwd` 内部。
  - 运行 shell commands 时设置 `cwd`、timeout、output limits，并返回结构化结果。
  - 还不要构建 approvals。
  - 还不要添加 sandbox。
  - 还不要构建 agent loop。
- 可能涉及的文件或区域：`src/tools/write-file.ts`、`src/tools/shell.ts`、`src/tools/registry.ts`
- 依赖：TODO-006、TODO-007
- 参考 `pi`：

  - `pi` 在 [packages/coding-agent/src/core/tools/](../packages/coding-agent/src/core/tools/) 下有更谨慎的 shell tool 和 approval model。
  - ChatRealm 的 TODO-008 应保持更小。
  - MVP shell tool 不是安全沙箱。它只设置 cwd、timeout 和 output limits。
- 新手心智模型：

  - Read/search tools 观察项目。
  - Write/shell tools 可以改变项目。
  - 所以它们的边界更重要。
  - `write_file` 应强制执行 path confinement。
  - `shell_command` 应返回 stdout、stderr 和 exit code，而不是让整个程序崩掉。
- 开始前：

  - 先完成 TODO-007。
  - 从 `ChatRealm/` 运行 `npm run check`。
  - 添加 TODO-008 前，先修复所有 TODO-007 type errors。
  - 确认 `src/tools/path.ts` 导出 `resolveInsideCwd`。
  - 确认 `AgentTool` 使用的是 `execute`，不是 `excute`。
- 分步实现指南：

  1. 创建 `src/tools/write-file.ts`。

     - 从 `node:fs/promises` 导入 `mkdir` 和 `writeFile`。
     - 从 `node:path` 导入 `dirname`。
     - 导入 `AgentTool`、`JsonObject` 和 `resolveInsideCwd`。
     - 推荐 imports：

       ```ts
       import { mkdir, writeFile } from "node:fs/promises";
       import { dirname } from "node:path";
       import type { JsonObject } from "../ai/types.js";
       import { resolveInsideCwd } from "./path.js";
       import type { AgentTool } from "./types.js";
       ```
  2. 在 `write-file.ts` 中添加小的 argument readers。

     - 添加 `readRequiredString`，用于 `path` 和 `content`。
     - 添加 `readOptionalBoolean`，用于 `overwrite`。
     - 推荐形状：

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
     - 不要要求 `content` 非空。
     - 空内容是合法的，因为写入空文件可能是有意行为。
  3. 定义 write-file tool metadata。

     - 导出名为 `writeFileTool` 的常量。
     - 推荐 name：`write_file`。
     - 推荐参数：

       - `path`：required relative file path。
       - `content`：required string content。
       - `overwrite`：optional boolean，默认 `false`。
     - 推荐 definition：

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
  4. 实现 `write_file`。

     - 校验 arguments。
     - 通过 `resolveInsideCwd` 解析 `path`。
     - 创建 parent directory。
     - 当 `overwrite` 为 false 时使用 `flag: "wx"`。
     - 当 `overwrite` 为 true 时使用 `flag: "w"`。
     - 推荐形状：

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
     - 为什么默认 `overwrite` 是 false：

       - 学习阶段可以避免意外替换文件。
       - 后续 agent 如果明确想替	换文件，可以显式传 `overwrite: true`。
  5. 创建 `src/tools/shell.ts`。

     - MVP 用 Node 的 `exec`，因为它接收一个 command string。
     - 导入 `ExecException` type，避免使用 `any`。
     - 推荐 imports：

       ```ts
       import { exec, type ExecException } from "node:child_process";
       import type { JsonObject } from "../ai/types.js";
       import type { AgentTool } from "./types.js";
       ```
  6. 添加 shell constants。

     - 添加保守默认值：

       ```ts
       const DEFAULT_TIMEOUT_MS = 30_000;
       const MAX_TIMEOUT_MS = 120_000;
       const MAX_BUFFER_BYTES = 1024 * 1024;
       ```
     - `DEFAULT_TIMEOUT_MS` 防止命令永远挂住。
     - `MAX_TIMEOUT_MS` 防止 model 请求很长时间的命令。
     - `MAX_BUFFER_BYTES` 防止巨大输出占太多内存。
  7. 添加 shell argument readers。

     - 添加 `readRequiredString`，用于 `command`。
     - 添加 `readOptionalNumber`，用于 `timeoutMs`。
     - 推荐 timeout helper：

       ```ts
       function clampTimeout(timeoutMs: number | undefined): number {
         if (timeoutMs === undefined) {
           return DEFAULT_TIMEOUT_MS;
         }

         return Math.max(1_000, Math.min(MAX_TIMEOUT_MS, Math.floor(timeoutMs)));
       }
       ```
  8. 定义一个小的 shell execution result。

     - 添加内部 interface：

       ```ts
       interface ShellExecution {
         stdout: string;
         stderr: string;
         exitCode: number;
       }
       ```
     - 这样可以把 process execution 和 tool-result formatting 分开。
  9. 添加 `runShellCommand`。

     - 用 Promise 包装 `exec`。
     - 始终 resolve stdout、stderr 和 exit code。
     - 推荐形状：

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
     - shell tool 不应该因为 non-zero exit code 直接 throw。
     - non-zero exit code 是正常 command result。
  10. 添加 `getExitCode`。

      - 推荐形状：

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
      - 这样 failed commands 不会变成难懂的 JavaScript exception。
  11. 添加 shell output formatting。

      - 输出保持简洁且明确。
      - 推荐 helper：

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
  12. 定义 shell tool metadata。

      - 导出名为 `shellTool` 的常量。
      - 推荐 name：`shell_command`。
      - 推荐参数：

        - `command`：required string。
        - `timeoutMs`：optional number。
      - 推荐 definition：

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
  13. 实现 `shell_command`。

      - 校验 `command`。
      - clamp `timeoutMs`。
      - 在 `context.cwd` 中运行命令。
      - non-zero exit code 返回 `isError: true`。
      - 推荐形状：

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

  - 重要安全说明：
    - 这不会完整 sandbox shell commands。
    - 它只设置 working directory、timeout 和 output limit。
    - 不要把它当成可以暴露给不可信 prompt 的安全工具。

  14. 更新 `src/tools/registry.ts`。
      - 导入新工具：

        ```ts
        import { shellTool } from "./shell.js";
        import { writeFileTool } from "./write-file.js";
        ```
      - 更新 `createDefaultToolRegistry`：

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
      - 保持 read 和 search tools 已注册。
      - 这里不要添加 agent-loop execution。
  15. 运行类型检查。
      - 从 `ChatRealm/` 运行：

        ```powershell
        npm run check
        ```
      - 移动到下一步前修复所有 TypeScript 错误。
      - 常见修复：

        - 如果 `ExecException` import 失败，检查 `node:child_process` import 写法。
        - 如果 `writeFile` options 失败，检查 `{ encoding, flag }` object form。
        - 如果 `execute` 不存在，检查 `AgentTool` interface 拼写。
        - 如果 registry 有 duplicate tool names，检查每个 `definition.name`。
  16. 可选手动 smoke check。
      - 这不是正式 test suite。
      - 它是在 agent loop 出现前，快速端到端检查 TODO-008 的方法。
      - 在 `ChatRealm/` root 下创建临时文件 `tool-smoke.ts`。
      - 不要提交这个文件。
      - 添加下面的脚本：

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
      - 从 `ChatRealm/` 运行：

        ```powershell
        npm exec tsx -- ./tool-smoke.ts
        ```
      - 预期输出：

        ```text
        todo-008 smoke ok
        ```
      - 这个 smoke check 证明：

        - default registry 包含 `write_file` 和 `shell_command`。
        - `write_file` 会创建 parent directories。
        - `write_file` 会写入 UTF-8 content。
        - `write_file` 默认拒绝 overwrite。
        - `write_file` 只在 `overwrite: true` 时覆盖。
        - `write_file` 会拒绝 `../` path escape。
        - `shell_command` 能捕获成功命令的 stdout。
        - `shell_command` 会把 non-zero exit code 标记为 `isError: true`。
      - 如果失败：

        - 如果 imports 失败，检查文件名和 `.js` import suffix。
        - 如果 `writeFileTool.execute` 不存在，检查 `AgentTool` method name。
        - 如果 overwrite 没被阻止，检查 `flag: "wx"` write option。
        - 如果 path escape 被允许，检查 `resolveInsideCwd`。
        - 如果 shell output 缺失，检查 `formatShellResult`。
        - 如果 exit code `2` 没被识别，检查 `getExitCode`。
      - 最后删除 scratch script：

        ```powershell
        Remove-Item .\tool-smoke.ts
        ```
- 新手 notes：

  - `write_file` 仍然比 shell 更安全，因为它能强制 cwd path confinement。
  - `shell_command` 很强也很危险；cwd 和 timeout 是 guardrails，不是 sandbox。
  - exit code 为 `1` 的 command 应返回 tool result，而不是 crash process。
  - 保持 stdout 和 stderr 都可见，后续 agent 行为才容易 debug。
  - 不要因为 stdout 存在就隐藏 stderr。
- 验收标准：

  - `src/tools/write-file.ts` 导出 `writeFileTool`。
  - `src/tools/shell.ts` 导出 `shellTool`。
  - `write_file` 接受 `path`、`content` 和 optional `overwrite`。
  - `write_file` 拒绝 `cwd` 外的路径。
  - `write_file` 默认不覆盖已有文件。
  - `shell_command` 接受 `command` 和 optional `timeoutMs`。
  - `shell_command` 在 `ToolContext.cwd` 中运行。
  - `shell_command` 返回 stdout、stderr 和 exit code。
  - non-zero shell exit codes 产生 `isError: true`。
  - `createDefaultToolRegistry()` 包含 read、search、write 和 shell tools。
  - 还没有添加 agent loop。
  - 还没有添加 approvals 或 sandbox system。
  - 从 `ChatRealm/` 运行 `npm run check` 成功。
- Reviewer checklist：

  - 确认 file writes 不能逃出 `ToolContext.cwd`。
  - 确认 shell command output 同时包含 stdout 和 stderr。
  - 确认 shell timeout 被执行。
  - 确认没有使用 `any`。
  - 确认没有 dynamic imports。
  - 确认 TODO-010 仍然负责决定何时执行 requested tools。

### TODO-009：构建最小 Agent State

- 状态：pending
- 目标：定义 TODO-010 的 agent loop 可以读取和追加的 in-memory state 形状。
- 范围：
  - 创建 `src/agent/`。
  - 创建 `src/agent/state.ts`。
  - 创建 `src/agent/prompt.ts`。
  - 存储当前 `cwd`。
  - 存储所选 `model`。
  - 存储 `systemPrompt`。
  - 存储 conversation `messages`。
  - 存储最小 run metadata，例如 turn count、max turns、started time 和 updated time。
  - 添加用于追加 user、assistant 和 tool-result messages 的小 helper functions。
  - 还不要调用 model。
  - 还不要执行 tools。
  - 还不要把 sessions 持久化到磁盘。
  - 还不要构建 agent loop。
- 可能涉及的文件或区域：`src/agent/state.ts`、`src/agent/prompt.ts`
- 依赖：TODO-004、TODO-006
- 参考 `pi`：
  - `pi` 在 [packages/coding-agent/src/core/agent-session.ts](../packages/coding-agent/src/core/agent-session.ts) 里有大得多的 session abstraction。
  - ChatRealm 不应该复制它。
  - MVP 要学习的是更小的内容：保留足够 state，用来构建 `ChatRequest`，并在 tool results 后继续。
- 新手心智模型：
  - agent loop 是一段重复对话。
  - `AgentState` 是这段对话的 notebook。
  - User messages、assistant messages 和 tool-result messages 都放进同一个有顺序的 `messages` array。
  - Tool results 不是单独的魔法；它们是 role 为 `"toolResult"` 的 messages。
  - TODO-009 创建 notebook。TODO-010 写使用 notebook 的 loop。
- 分步实现指南：
  1. 创建 agent 文件夹。
     - 创建 `src/agent/`。
     - 创建 `src/agent/state.ts`。
     - 创建 `src/agent/prompt.ts`。
  2. 在 `src/agent/state.ts` 中添加 imports。
     - 从 `src/ai/types.ts` 导入 message types。
     - 从 `src/tools/types.ts` 导入 `ToolResult`。
     - 推荐 imports：

       ```ts
       import type {
         AssistantMessage,
         Message,
         ToolResultMessage,
         UserMessage,
       } from "../ai/types.js";
       import type { ToolResult } from "../tools/types.js";
       ```
     - 为什么复用这些 types：

       - `ChatRequest.messages` 已经期望 `Message[]`。
       - `ToolResultMessage` 已经是 TODO-010 执行 tool 后要追加的形状。
       - 复用类型可以避免后面把 state messages 再转换成另一套 message shapes。
  3. 定义 state creation options。
     - 导出名为 `CreateAgentStateOptions` 的 interface。
     - 推荐形状：

       ```ts
       export interface CreateAgentStateOptions {
         cwd: string;
         model: string;
         systemPrompt: string | undefined;
         maxTurns?: number;
       }
       ```
     - `cwd` 和 `model` 必须有，因为 loop 都需要。
     - `systemPrompt` 显式传入，让调用方决定是否使用 default prompt。
     - `maxTurns` 可选，因为 state 可以提供默认值。
  4. 定义 run metadata。
     - 导出名为 `AgentRunMetadata` 的 interface。
     - 推荐形状：

       ```ts
       export interface AgentRunMetadata {
         turnCount: number;
         maxTurns: number;
         startedAt: string;
         updatedAt: string;
       }
       ```
     - `turnCount` 帮助 TODO-010 阻止无限循环。
     - `maxTurns` 是限制。
     - ISO string 容易检查，也方便 TODO-012 后续持久化。
  5. 定义 `AgentState`。
     - 导出名为 `AgentState` 的 interface。
     - 推荐形状：

       ```ts
       export interface AgentState {
         cwd: string;
         model: string;
         systemPrompt: string | undefined;
         messages: Message[];
         run: AgentRunMetadata;
       }
       ```
     - 保持 state 小。
     - 现在不要添加 token accounting、cost、session IDs、branches、UI state 或 persistence。
  6. 添加 `createAgentState`。
     - 导出名为 `createAgentState` 的函数。
     - 推荐形状：

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
     - 默认 `10` turns 可以避免后续 loop 永远运行。
  7. 添加 timestamp helper。
     - 添加一个内部函数：

       ```ts
       function touch(state: AgentState): void {
         state.run.updatedAt = new Date().toISOString();
       }
       ```
     - 这里是有意 mutation state。
     - 对 MVP 来说，mutable in-memory state 比 immutable state updates 更简单。
  8. 添加 `appendUserMessage`。
     - 导出一个追加 user message 的函数。
     - 推荐形状：

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
     - 这里不要 trim 或 validate prompt。
     - CLI input validation 应更靠近 CLI code。
  9. 添加 `appendAssistantMessage`。
     - 导出一个追加 assistant message 的函数。
     - 推荐形状：

       ```ts
       export function appendAssistantMessage(
         state: AgentState,
         message: AssistantMessage,
       ): void {
         state.messages.push(message);
         touch(state);
       }
       ```
     - provider adapter 已经返回 `AssistantMessage`。
     - State 应原样存储它。
  10. 添加 `appendToolResultMessage`。
      - 导出一个把 `ToolResult` 转成 `ToolResultMessage` 的函数。
      - 推荐形状：

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
      - 这是 tool execution 和下一次 provider request 之间的桥。
      - TODO-010 会在执行 requested tool 后调用它。
  11. 添加 turn helpers。
      - 导出 `incrementTurn`。
      - 导出 `hasRemainingTurns`。
      - 推荐形状：

        ```ts
        export function incrementTurn(state: AgentState): void {
          state.run.turnCount += 1;
          touch(state);
        }

        export function hasRemainingTurns(state: AgentState): boolean {
          return state.run.turnCount < state.run.maxTurns;
        }
        ```
      - TODO-010 会用这些函数在过多 model/tool cycles 后停止。
  12. 添加 `src/agent/prompt.ts`。
      - 导出 default system prompt builder。
      - 推荐形状：

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
      - 保持 prompt 简短。
      - 不要从 `pi` 复制大 prompt。
      - TODO-011 可以把它接进 CLI execution。
  13. 可选 convenience function。
      - 如果你想要一个常见场景的简单 constructor，可以添加：

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
      - 这是可选的。
      - 如果它造成 import cycles 或理解成本，跳过它。
  14. 运行类型检查。
      - 从 `ChatRealm/` 运行：

        ```powershell
        npm run check
        ```
      - 移动到下一步前修复所有 TypeScript 错误。
      - 常见修复：

        - 如果 imports 失败，检查 `.js` import suffix。
        - 如果 `ToolResultMessage` 字段不匹配，对照 `src/ai/types.ts`。
        - 如果 `ToolResult` import 失败，检查 `src/tools/types.ts`。
        - 如果 date values 不是 string，使用 `new Date().toISOString()`。
  15. 可选手动 smoke check。
      - 在 `ChatRealm/` 中创建临时 `agent-state-smoke.ts`。
      - 不要提交它。
      - 添加下面的脚本：

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
      - 从 `ChatRealm/` 运行：

        ```powershell
        npm exec tsx -- ./agent-state-smoke.ts
        ```
      - 预期输出：

        ```text
        todo-009 smoke ok
        ```
      - 最后删除 scratch script：

        ```powershell
        Remove-Item .\agent-state-smoke.ts
        ```
- 新手 notes：
  - State 不是 agent loop。
  - State 只记录已经发生的事情，以及 loop 需要的设置。
  - 把所有 messages 放在一个有序 array 里，后续 provider requests 会更简单。
  - Tool results 会变成 `ToolResultMessage` entries。
  - Persistence 故意延后到 TODO-012。
- 验收标准：
  - `src/agent/state.ts` 存在。
  - `src/agent/prompt.ts` 存在。
  - 导出 `AgentState`、`AgentRunMetadata` 和 `CreateAgentStateOptions`。
  - `createAgentState` 创建空的 in-memory state。
  - 可以追加 user messages。
  - 可以追加 assistant messages。
  - 可以把 tool results 追加为 `ToolResultMessage`。
  - 可以 increment turn count。
  - remaining-turn checks 工作正常。
  - 存在 default system prompt builder。
  - 没有 model call。
  - 没有 tool execution。
  - 没有 session persistence。
  - 从 `ChatRealm/` 运行 `npm run check` 成功。
- Reviewer checklist：
  - 确认 state 使用 `src/ai/types.ts` 中的 provider-neutral message types。
  - 确认 tool result state 使用 `src/tools/types.ts` 中的 `ToolResult`。
  - 确认没有使用 `any`。
  - 确认没有 dynamic imports。
  - 确认 state 不知道 OpenAI-specific response shapes。
  - 确认 TODO-010 仍然负责 model calls 和 tool execution。

### TODO-010：实现 Agent Loop

- 状态：pending
- 目标：构建第一个真实 agent loop：把 conversation state 发给模型，识别 assistant response 里的 tool calls，执行这些工具，追加 tool-result messages，并重复这个过程，直到模型返回最终答案或达到 `maxTurns`。
- 范围：
  - 创建 `src/agent/agent-loop.ts`。
  - 如果能让 TODO-011 更容易，可以创建一个很小的 `src/agent/agent.ts` public wrapper。
  - 使用 `src/ai/types.ts` 中已有的 `ChatTransport` 抽象。
  - 使用 `src/tools/registry.ts` 中已有的 `ToolRegistry`。
  - 使用 `src/agent/state.ts` 中已有的 state helpers。
  - 从 `AgentState` 构建 `ChatRequest`。
  - 每个 loop turn 调用一次 `transport.complete(request)`。
  - 把每个 assistant response 追加到 state。
  - 从 assistant message 中提取 `toolCall` content blocks。
  - 使用 `ToolContext.cwd` 执行请求的 tools。
  - 把每个 tool result 追加为 `toolResult` message。
  - 当 assistant response 没有 tool calls 时停止。
  - 如果在最终答案前耗尽 max turns，抛出清晰错误。
  - 还不要端到端连接 CLI；TODO-011 负责。
  - 还不要添加 session persistence；TODO-012 负责。
  - 还不要添加高级 approval/sandbox 逻辑。
  - 还不要添加 streaming。
- 可能涉及的文件或区域：`src/agent/agent-loop.ts`、`src/agent/agent.ts`、`test/agent-loop.test.ts`
- 依赖：TODO-005、TODO-006、TODO-009
- 参考 `pi`：
  - `pi` 有更完整的 runtime，包含 sessions、event streams、approvals、provider routing 和 UI updates。
  - ChatRealm 这里只实现最小 loop pattern：
    1. 请求模型
    2. 保存 assistant message
    3. 运行 requested tools
    4. 保存 tool results
    5. 再次请求模型
  - 不要复制 `pi` 的生产级 event/session 架构。
- 新手心智模型：
  - loop 不是 provider，也不是 tools。
  - provider 决定说什么或调用哪些 tools。
  - registry 决定某个名字的 tool 是否存在。
  - tool 自己决定如何执行。
  - state 按顺序记录每个 user、assistant 和 tool-result message。
  - loop 是把这些部件连接起来的协调器。
  - tool result 追加后，下一次 provider call 会带上这个结果，让模型基于真实观察继续。
- 重要行为：
  - 最终 assistant answer 是一个没有 `toolCall` content block 的 assistant message。
  - tool-use turn 是一个包含一个或多个 `toolCall` content blocks 的 assistant message。
  - tool errors 不应该让 loop 崩溃。它们应该作为 `isError: true` 的 `toolResult` messages 追加，让模型可以处理错误。
  - unknown tool names 也应该变成 tool-result errors，而不是未处理异常。
  - provider errors 暂时可以 throw；TODO-013 会统一用户可见错误输出。
  - max-turn exhaustion 应该抛出清晰错误，因为这表示模型没有及时产出最终答案。
- 分步实现指南：
  1. 创建 agent loop 文件。
     - 创建 `src/agent/agent-loop.ts`。
     - 这个文件只包含核心 loop。
     - 不要在这里导入 CLI parsing 或 config loading。
  2. 添加 imports。
     - 导入 provider 和 message types：

       ```ts
       import type {
         AssistantMessage,
         ChatRequest,
         ChatTransport,
         ToolCallContent,
       } from "../ai/types.js";
       ```
     - 导入 tool registry：

       ```ts
       import type { ToolRegistry } from "../tools/registry.js";
       ```
     - 导入 state helpers：

       ```ts
       import {
         appendAssistantMessage,
         appendToolResultMessage,
         hasRemainingTurns,
         incrementTurn,
         type AgentState,
       } from "./state.js";
       ```
     - 只作为 TypeScript 类型使用的 import 应使用 type-only import。
     - 本项目使用 Node ESM，本地 imports 保持 `.js` 后缀。
  3. 定义 loop options。
     - 导出名为 `RunAgentLoopOptions` 的 interface。
     - 推荐形状：

       ```ts
       export interface RunAgentLoopOptions {
         state: AgentState;
         transport: ChatTransport;
         tools: ToolRegistry;
       }
       ```
     - 三个输入的含义：

       - `state` 包含 model、cwd、system prompt、messages 和 turn metadata。
       - `transport` 是模型边界。
       - `tools` 是本地动作边界。
  4. 定义 loop result。
     - 导出名为 `RunAgentLoopResult` 的 interface。
     - 推荐形状：

       ```ts
       export interface RunAgentLoopResult {
         state: AgentState;
         finalMessage: AssistantMessage;
       }
       ```
     - 返回 `state` 方便 TODO-011 和 TODO-012 使用。
     - 返回 `finalMessage` 让 print mode 可以只渲染最终 assistant response。
  5. 添加构建 model request 的 helper。
     - 添加名为 `createChatRequest` 的小函数。
     - 推荐形状：

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
     - 这样 request shape 容易检查。
     - MVP 阶段不要为了防御性而 clone messages，除非你遇到具体 mutation bug。
  6. 添加提取 tool calls 的 helper。
     - 添加名为 `getToolCalls` 的函数。
     - 推荐形状：

       ```ts
       function getToolCalls(message: AssistantMessage): ToolCallContent[] {
         return message.content.filter((content) => content.type === "toolCall");
       }
       ```
     - TypeScript 应该能把过滤后的 content narrow 成 `ToolCallContent[]`。
     - 如果 TypeScript 不能自动 narrow，使用一个小 type guard：

       ```ts
       function isToolCallContent(content: AssistantMessage["content"][number]): content is ToolCallContent {
         return content.type === "toolCall";
       }
       ```
     - 然后使用 `message.content.filter(isToolCallContent)`。
  7. 实现 `runAgentLoop`。
     - 导出 async function，命名为 `runAgentLoop`。
     - 推荐骨架：

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
     - 在每次 provider call 前 increment turn。
     - 一个 turn 表示一次 model request，不表示一次 tool execution。
     - 先追加 assistant message，再执行 tools，因为 OpenAI 风格 API 期望 assistant tool-call message 出现在 tool results 之前。
  8. 实现 tool-call execution。
     - 添加名为 `executeToolCall` 的 helper。
     - 推荐形状：

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
     - 使用 `tools.get()` 而不是 `tools.require()`，这样 unknown tools 可以变成模型可见的 tool errors。
     - 同一个 assistant message 里，一个 tool 失败不应该阻止后续 tool calls 执行。
     - tool context 现在只使用 `state.cwd`。
  9. 添加小型 error formatter。
     - 添加内部 helper：

       ```ts
       function formatToolExecutionError(error: unknown): string {
         if (error instanceof Error) {
           return error.message;
         }

         return "Tool execution failed with a non-Error value";
       }
       ```
     - 不要使用 `any`。
     - 先保持为局部 helper；TODO-013 可以再引入共享 error utilities。
  10. 决定是否添加 `src/agent/agent.ts`。
      - 如果你想为后续 print mode 准备 public wrapper，可以创建 `src/agent/agent.ts`。
      - 保持它很小。
      - 建议职责：
        - 接收已经创建好的 state、transport 和 registry
        - 调用 `runAgentLoop`
        - 返回结果
      - 如果这个文件显得多余，TODO-010 可以跳过它，等 TODO-011 连接 CLI 时再创建。
      - 现在不要创建大型 `Agent` class。
  11. 添加临时 fake-provider smoke check。
      - 因为测试基础设施仍然很小，本 TODO 用临时脚本就够。
      - 在 `ChatRealm/` 下创建 `agent-loop-smoke.ts`。
      - 不要提交它。
      - 使用 fake `ChatTransport`，返回：

        1. 第一次 response：assistant 请求 `read_file`
        2. 第二次 response：assistant 返回最终文本
      - 示例：

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
      - 从 `ChatRealm/` 运行：

        ```powershell
        npm exec tsx -- ./agent-loop-smoke.ts
        ```
      - 预期输出：

        ```text
        todo-010 smoke ok
        ```
      - 最后删除 scratch script：

        ```powershell
        Remove-Item .\agent-loop-smoke.ts
        ```
  12. 添加可选的聚焦手动检查。
      - Unknown tool：
        - Fake provider 请求一个未注册的 tool name。
        - 预期 state 包含一个 `isError: true` 的 `toolResult`。
        - loop 继续运行，让 fake provider 产出最终答案。
      - Tool throws：
        - Fake tool 抛出 `new Error("boom")`。
        - 预期 state 包含 `content: "boom"` 且 `isError: true` 的 `toolResult`。
      - Max turns：
        - Fake provider 永远请求 tool。
        - 设置 `maxTurns: 1`。
        - 预期 `runAgentLoop` 抛出 `Agent loop reached max turns (1) before a final answer`。
  13. 运行类型检查。
      - 从 `ChatRealm/` 运行：

        ```powershell
        npm run check
        ```
      - 进入下一步前修复所有 TypeScript errors。
      - 常见修复：

        - 如果 imports 失败，检查 `.js` import suffixes。
        - 如果 `ToolCallContent` filtering 失败，添加第 6 步的 type guard。
        - 如果 `ToolRegistry` import 报错，使用 `import type`。
        - 如果 `error.message` 报错，记住 catch 到的值是 `unknown`。
  14. 保持 TODO-010 足够小。
      - 不要添加 CLI output formatting。
      - 不要在 `runAgentLoop` 里打印 assistant text。
      - 不要加载 API keys。
      - 不要在这里构造 OpenAI transport。
      - 不要在这里持久化 sessions。
      - 不要实现 approvals。
      - 不要添加 streaming callbacks。
- `src/agent/agent-loop.ts` 的最小预期职责：
  - 导出 `RunAgentLoopOptions`。
  - 导出 `RunAgentLoopResult`。
  - 导出 `runAgentLoop`。
  - 从 state 和 tool definitions 构建 `ChatRequest`。
  - 调用 `ChatTransport.complete`。
  - 追加 assistant messages。
  - 通过 `ToolRegistry` 执行 tool calls。
  - 追加 tool results。
  - 返回第一个没有 tool calls 的 assistant message。
  - max-turn exhaustion 时抛出错误。
- 新手 notes：
  - loop 不应该知道 OpenAI response JSON。`openai-compatible.ts` 已经把 provider response 转成 `AssistantMessage`。
  - loop 不应该知道每个 tool 如何校验 arguments。每个 tool 自己负责解析和校验。
  - loop 不应该打印输出。返回 `finalMessage` 可以让它复用于 CLI、tests 和未来 session persistence。
  - 先追加 assistant message 再追加 tool results 很重要，因为 chat completion APIs 通常要求 tool results 引用前面的 assistant tool call。
  - 一个 model 可以在同一个 assistant message 里请求多个 tools。按顺序全部执行，并为每个 tool call 追加一个 tool-result message。
- 验收标准：
  - `src/agent/agent-loop.ts` 存在。
  - 导出 `runAgentLoop`。
  - loop 使用 `state.model`、`state.systemPrompt`、`state.messages` 和 `tools.definitions()` 构建 requests。
  - loop 持续调用 transport，直到收到没有 tool calls 的 assistant message。
  - Assistant messages 会追加到 `AgentState`。
  - Tool calls 通过 `ToolRegistry` 执行。
  - Tool results 使用原始 tool call id 和 tool name 追加。
  - Unknown tool names 会变成 `isError: true` tool results。
  - thrown tool errors 会变成 `isError: true` tool results。
  - max-turn exhaustion 抛出清晰错误。
  - 还没有添加 CLI wiring。
  - 这里没有添加 config loading。
  - 这里没有添加 session persistence。
  - 没有添加 streaming renderer。
  - 没有使用 `any`。
  - 没有使用 dynamic imports。
  - 从 `ChatRealm/` 运行 `npm run check` 成功。
- Reviewer checklist：
  - 确认一个 turn 对应一次 provider call。
  - 确认 loop 不会无限运行。
  - 确认 tool results 对下一次 provider request 可见。
  - 确认 unknown tool names 不会 crash process。
  - 确认 provider-specific JSON shapes 没有泄漏进 `agent-loop.ts`。
  - 确认实现足够小，TODO-011 可以不重构就接入。

### TODO-011：端到端连接 Print Mode

- 状态：pending
- 目标：把 placeholder CLI 行为替换成真实 print-mode run，让 `npm run dev -- -p "your task"` 可以加载配置、调用模型、通过 agent loop 运行 tools，并打印最终 assistant answer。
- 范围：
  - 更新 `src/main.ts`。
  - 如果你想在 state creation 和 `runAgentLoop` 外包一层小 wrapper，可以创建 `src/agent/agent.ts`。
  - 使用 `parseArgs` 解析 CLI args。
  - 当使用 `--help` 或 `-h` 时，打印 help 并退出，不加载 config。
  - 正常执行时要求必须有 prompt。
  - 使用 `loadConfig` 加载配置。
  - 合并 CLI overrides 和 config values。
  - 创建 OpenAI-compatible transport。
  - 创建 default tool registry。
  - 创建 agent state。
  - 把 user prompt 追加到 state。
  - 运行 `runAgentLoop`。
  - 只把最终 assistant text 打印到 stdout。
  - 错误处理先保持简单；TODO-013 会改进用户可见错误格式。
  - 还不要添加 session persistence。
  - 还不要添加 streaming output。
  - 还不要添加 TUI 行为。
- 可能涉及的文件或区域：`src/main.ts`、`src/agent/agent.ts`
- 依赖：TODO-002、TODO-003、TODO-005、TODO-010
- 参考 `pi`：
  - `pi` 有多个 execution surfaces 和更丰富的 lifecycle。
  - ChatRealm 这里只实现一条路径：
    1. 解析 terminal input
    2. 加载 configuration
    3. 构造 provider/tools/state
    4. 运行 loop
    5. 打印最终文本
  - 不要复制 `pi` 的 TUI、session resume、RPC、provider registry 或 event renderer。
- 新手心智模型：
  - TODO-010 做出了 engine。
  - TODO-011 负责把启动开关接上。
  - `main.ts` 可以知道 CLI args、config、provider construction 和 process exit codes。
  - `agent-loop.ts` 应保持可复用，不应该知道 terminal output。
- 优先级规则：
  - Prompt：
    - 使用 `parsed.prompt`。
    - 如果没有 prompt 且没有请求 help，抛出 `Missing prompt`。
  - Model：
    - 优先使用 `parsed.model`。
    - 否则使用 `config.model`。
    - 否则使用一个本地 MVP default model constant。
  - Provider：
    - 优先使用 `parsed.provider`。
    - 否则默认使用 `"openai-compatible"`。
    - 如果请求了其他 provider，抛出 `Unsupported provider: <name>`。
  - Cwd：
    - 优先使用 `parsed.cwd`。
    - 否则使用 `config.cwd`。
  - API key：
    - 使用 `config.apiKey`。
    - 如果缺失，抛出 `Missing API key. Set CHATREALM_API_KEY or apiKey in chatrealm.config.json`。
  - Base URL：
    - 如果 `config.baseUrl` 存在，把它传给 OpenAI-compatible transport。
- 分步实现指南：
  1. 决定是否添加 `src/agent/agent.ts`。
     - 这个文件是可选的。
     - 如果添加，保持它小，并聚焦 print-mode orchestration。
     - 合理的导出函数名是 `runAgent`。
     - 建议 input shape：

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
     - wrapper 可以：

       - create state
       - append user prompt
       - call `runAgentLoop`
       - return final message
     - 如果这个 wrapper 显得多余，先把 orchestration 直接放在 `main.ts`。
     - 除非真的有需要管理的 stateful behavior，不要创建 `Agent` class。
  2. 在 `src/main.ts` 添加 imports。
     - 用真实依赖替换 placeholder imports：

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
     - 如果你添加了 `src/agent/agent.ts`，按实际 wrapper 调整 imports。
     - 本地 import suffix 保持 `.js`。
     - 只使用 top-level imports。
  3. 在 `src/main.ts` 添加 constants。
     - 添加 provider name constant：

       ```ts
       const OPENAI_COMPATIBLE_PROVIDER = "openai-compatible";
       ```
     - 添加 local default model constant：

       ```ts
       const DEFAULT_MODEL = "gpt-4.1-mini";
       ```
     - default model 只是学习项目 fallback。
     - 用户可以通过 `--model`、`CHATREALM_MODEL` 或 `chatrealm.config.json` 覆盖。
  4. 创建 async `main` function。
     - 推荐形状：

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
     - Help 不应该加载 config、要求 API key、调用模型或打印 JSON。
     - 这会修复当前 placeholder behavior：help 仍然触碰 config/debug output。
  5. 校验 prompt。
     - 在 help check 之后添加：

       ```ts
       if (parsed.prompt === undefined) {
         throw new Error("Missing prompt");
       }
       ```
     - 不要静默使用空 prompt。
     - 本 TODO 不要交互式询问 prompt。
  6. 加载 config。
     - 添加：

       ```ts
       const config = loadConfig();
       ```
     - 暂时把 config loading 保持在 `main.ts`。
     - 不要在 provider 或 agent-loop code 里加载 config。
  7. 解析 provider、model、cwd 和 API key。
     - 推荐代码：

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
     - 保持这段逻辑显式。
     - 不要把 provider selection 藏进 `createOpenAICompatibleTransport`。
  8. 创建 runtime dependencies。
     - 推荐代码：

       ```ts
       const transport = createOpenAICompatibleTransport({
         apiKey,
         baseUrl: config.baseUrl,
       });

       const tools = createDefaultToolRegistry();
       ```
     - 这是第一次把真实 provider 和真实 tools 接起来。
     - 还不要添加 approvals。
  9. 创建 state 并追加 user prompt。
     - 推荐代码：

       ```ts
       const state = createAgentState({
         cwd,
         model,
         systemPrompt: buildDefaultSystemPrompt(),
       });

       appendUserMessage(state, parsed.prompt);
       ```
     - 本 TODO 不要持久化 state。
     - TODO-012 会决定如何保存和加载 sessions。
  10. 运行 agent loop。
      - 推荐代码：

        ```ts
        const result = await runAgentLoop({
          state,
          transport,
          tools,
        });
        ```
      - 如果你创建了 `src/agent/agent.ts` 里的 `runAgent`，这里调用 wrapper。
  11. 渲染最终 assistant text。
      - 在 `src/main.ts` 添加 helper：

        ```ts
        function renderAssistantText(message: AssistantMessage): string {
          return message.content
            .filter((content) => content.type === "text")
            .map((content) => content.text)
            .join("\n");
        }
        ```
      - 如果 TypeScript 不能 narrow 过滤后的 content，使用一个小 type guard。
      - 打印渲染后的 text：

        ```ts
        const text = renderAssistantText(result.finalMessage);

        if (text !== "") {
          console.log(text);
        }
        ```
      - 正常执行时不要打印完整 JSON state。
      - 除非临时 debug，不要打印 tool call internals。
  12. 添加 top-level error handling。
      - 推荐形状：

        ```ts
        main().catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          console.error(message);
          process.exitCode = 1;
        });
        ```
      - 错误使用 `console.error`。
      - messages 先保持简单；TODO-013 会改进格式。
  13. 不调用真实 provider 的手动检查。
      - 运行 help：

        ```powershell
        npm run dev -- --help
        ```
      - 预期：

        - 打印 usage text
        - 不打印 JSON debug output
        - 不要求 API key
      - 不带 prompt 运行：

        ```powershell
        npm run dev
        ```
      - 预期：

        - exit code 为 1
        - 打印 `Missing prompt`
      - 使用 unsupported provider 运行：

        ```powershell
        npm run dev -- -p "hi" --provider fake
        ```
      - 预期：

        - exit code 为 1
        - 打印 `Unsupported provider: fake`
      - 没有 API key 时运行：

        ```powershell
        npm run dev -- -p "hi"
        ```
      - 预期：

        - 如果没有配置 API key，exit code 为 1
        - 打印 missing API key message
  14. 可选 real-provider smoke check。
      - 只有当你已经配置了有效 API key，并且接受发起真实模型请求时才运行。
      - 示例：

        ```powershell
        $env:CHATREALM_API_KEY="..."
        npm run dev -- -p "Say exactly: ok"
        ```
      - 预期输出：

        ```text
        ok
        ```
      - 如果 provider 返回了额外文字，不要为了这个 prompt 过度调整代码。这只是 smoke check。
  15. 运行类型检查。
      - 从 `ChatRealm/` 运行：

        ```powershell
        npm run check
        ```
      - 进入下一步前修复所有 TypeScript errors。
      - 常见修复：

        - 如果 top-level `await` 让人困惑，使用 `main().catch(...)` pattern。
        - 如果 text filtering 不能 narrow，添加 type guard。
        - 如果校验后 `parsed.prompt` 仍然可能是 undefined，在 guard 后保存为 local `const prompt = parsed.prompt`。
        - 如果 `config.cwd` 是 undefined，重新检查 `AppConfig`；它应该总是包含 `cwd`。
- `src/main.ts` 的最小预期行为：
  - `--help` 打印 usage 并成功退出。
  - 缺少 prompt 时以 error 退出。
  - unsupported provider 以 error 退出。
  - 缺少 API key 时以 error 退出。
  - 有效 config 会创建 OpenAI-compatible transport。
  - default tools 对 agent loop 可用。
  - loop 启动前 user prompt 已追加。
  - 最终 assistant text 打印到 stdout。
  - debug JSON output 被移除。
- 新手 notes：
  - `main.ts` 是 composition root：它把前面 TODO 创建的 pieces 接起来。
  - Composition root 代码可以直接、朴素；这对 MVP 是好事。
  - 把 provider-specific construction 留在 `main.ts`，不要放进 `agent-loop.ts`。
  - 把 rendering 留在 `main.ts`，不要放进 `agent-loop.ts`。
  - 还不要添加 session IDs；TODO-012 会引入这个边界。
- 验收标准：
  - `src/main.ts` 在正常执行时不再打印 parsed args JSON。
  - Help output 不需要 config 或 API key。
  - 正常执行需要 prompt。
  - CLI `--model` 覆盖 config model。
  - CLI `--provider` 覆盖 default provider selection。
  - CLI `--cwd` 覆盖 config cwd。
  - OpenAI-compatible runs 需要 `CHATREALM_API_KEY` 或 config `apiKey`。
  - 使用 `createOpenAICompatibleTransport`。
  - 使用 `createDefaultToolRegistry`。
  - 使用 `createAgentState` 和 `appendUserMessage`。
  - 调用 `runAgentLoop`。
  - 成功时只打印最终 assistant text。
  - 没有添加 session persistence。
  - 没有添加 streaming output。
  - 没有添加 TUI。
  - 没有使用 `any`。
  - 没有使用 dynamic imports。
  - 从 `ChatRealm/` 运行 `npm run check` 成功。
- Reviewer checklist：
  - 确认 `main.ts` 是唯一读取 process args 和通过 config 间接读取 process env 的地方。
  - 确认 help mode 在 config/provider setup 前退出。
  - 确认 provider-specific setup 没有泄漏进 `agent-loop.ts`。
  - 确认正常成功输出是 human-readable text，而不是 debug JSON。
  - 确认 TODO-012 仍然负责 session persistence。

### TODO-012：添加 JSON Session 持久化

- 状态：pending
- 目标：把 conversation history 持久化到磁盘，让后续 print-mode runs 可以从之前的 messages 继续，而不是每次都从空 state 开始。
- 范围：
  - 创建 `src/session/`。
  - 创建 `src/session/store.ts`。
  - 把 session data 以 JSON 保存到本地 session 目录。
  - 在追加新的 user prompt 前加载之前的 session messages。
  - 在 `runAgentLoop` 完成后保存更新后的 session data。
  - MVP 阶段只保留一个 default session。
  - 每次命令执行都重新创建 fresh run metadata。
  - 不要持久化 API keys 或 provider credentials。
  - 不要添加 session branching。
  - 不要添加 compaction。
  - 不要添加 session picker UI。
  - 不要添加数据库。
- 可能涉及的文件或区域：`src/session/store.ts`、`src/agent/state.ts`、`src/main.ts`
- 依赖：TODO-009、TODO-011
- 参考 `pi`：
  - `pi` 有更完整的 session concepts、compaction、lifecycle events 和 resume behavior。
  - ChatRealm 现在不应该复制这些。
  - MVP 只学习：
    1. serialize messages
    2. write JSON
    3. 下一次运行时 read JSON
    4. 继续 conversation
- 新手心智模型：
  - Session persistence 不是 agent loop。
  - loop 仍然只处理 in-memory `AgentState`。
  - session store 只负责在 disk JSON 和 state 需要的 messages 之间转换。
  - 每次 CLI run 都应该创建 fresh run metadata，即使加载了旧 messages。
  - 旧 messages 是 conversation history。`run.turnCount` 是当前进程的 execution metadata。
- MVP 的存储决策：
  - 使用一个 default session file。
  - 推荐路径：

    ```text
    <cwd>/.chatrealm/sessions/default.json
    ```
  - 这个路径从 effective agent `cwd` 解析，不从 repository root 解析。
  - 这样 session data 会靠近正在处理的项目。
  - 把 `.chatrealm/` 加入 git ignore rules，避免提交本地 session data。
- JSON file shape：
  - 使用带 version 的 object：

    ```ts
    interface SavedSession {
      version: 1;
      savedAt: string;
      messages: Message[];
    }
    ```
  - 只保存 JSON-safe values。
  - 不要保存 API keys。
  - 不要保存 transport objects、tool registries、functions 或 errors。
- 分步实现指南：
  1. 创建 session 文件夹。
     - 创建 `src/session/`。
     - 创建 `src/session/store.ts`。
  2. 在 `src/session/store.ts` 添加 imports。
     - 推荐 imports：

       ```ts
       import { mkdir, readFile, writeFile } from "node:fs/promises";
       import { dirname, resolve } from "node:path";

       import type { Message } from "../ai/types.js";
       import { parseJsonObject } from "../utils/json.js";
       ```
     - 只使用 top-level imports。
     - 使用 `fs/promises`，因为 session read/write 是 I/O。
  3. 定义 saved session types。
     - 添加：

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
     - `sessionName` 是 optional，这样 MVP 现在可以用 `"default"`，以后还有一个小扩展点。
     - 除非你明确同步更新 parser，否则现在不要添加 custom session name CLI support。
  4. 添加 path helpers。
     - 添加：

       ```ts
       const DEFAULT_SESSION_NAME = "default";

       export function getSessionPath(options: SessionStoreOptions): string {
         const sessionName = options.sessionName ?? DEFAULT_SESSION_NAME;
         return resolve(options.cwd, ".chatrealm", "sessions", `${sessionName}.json`);
       }
       ```
     - MVP 阶段保持 session names 简单且内部使用。
     - 现在不要从用户输入接收 arbitrary path-like session names。
  5. 添加 `loadSessionMessages`。
     - 导出函数：

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
     - 缺少 session file 表示没有 previous history。
     - Invalid JSON 应该 throw；不要静默丢弃。
  6. 添加 `saveSessionMessages`。
     - 导出函数：

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
     - 对学习项目来说，pretty JSON 可以接受，因为方便检查。
     - 保留 trailing newline。
  7. 添加 Node error helper。
     - 添加：

       ```ts
       function isNodeErrorWithCode(error: unknown, code: string): boolean {
         return (
           error instanceof Error &&
           "code" in error &&
           (error as { code?: unknown }).code === code
         );
       }
       ```
     - 不要使用 `any`。
     - 这个 helper 只用于识别 missing files。
  8. 添加 session JSON validation。
     - 添加 `parseSavedSession`。
     - 推荐形状：

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
     - 不要不检查就 `return value as SavedSession`。
  9. 添加 message validation。
     - 先扩展 `src/session/store.ts` 中的 type imports。
     - 推荐 type imports：

       ```ts
       import type {
         AssistantMessage,
         Message,
         ToolResultMessage,
         UserMessage,
       } from "../ai/types.js";
       ```
     - 添加可复用 object guard：

       ```ts
       function isRecord(value: unknown): value is Record<string, unknown> {
         return typeof value === "object" && value !== null && !Array.isArray(value);
       }
       ```
     - 添加 `parseMessage`。
     - 这个函数应该：

       - 拒绝 non-objects
       - 检查 `role`
       - 委托给 role-specific parser
       - 每个 error message 都包含 `sourceName`
     - 推荐形状：

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
     - 添加 `parseUserMessage`。
     - 推荐形状：

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
     - 添加 `parseToolResultMessage`。
     - 推荐形状：

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
     - 添加 `parseAssistantMessage`。
     - 推荐形状：

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
     - 保持 validation 聚焦。
     - 不要保留 JSON file 中的 unknown extra fields。
     - 重建干净的 message objects，而不是 mutate 或信任 loaded objects。
     - MVP 可以比生产环境更严格。
  10. 添加 assistant content validation。
      - 如果需要，继续扩展 type imports：

        ```ts
        import type {
          AssistantContent,
          JsonObject,
          JsonValue,
          TextContent,
          ToolCallContent,
        } from "../ai/types.js";
        ```
      - 添加 `parseAssistantContent`。
      - 推荐形状：

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
      - 添加 `parseTextContent`。
      - 推荐形状：

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
      - 添加 `parseToolCallContent`。
      - 推荐形状：

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
      - 为 tool-call arguments 添加 JSON value validation。
      - `ToolCallContent.arguments` 必须是 `JsonObject`，不能是任意 JavaScript object。
      - 推荐 helpers：

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
      - 不要使用 `any`。
      - 不要接受 functions、`undefined`、dates、class instances 或其他 non-JSON values。
  11. 添加 usage validation。
      - 如果需要，扩展 type imports：

        ```ts
        import type { StopReason, Usage } from "../ai/types.js";
        ```
      - 添加 `parseUsage`。
      - 推荐形状：

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
      - 添加 `parseNumber`。
      - 推荐形状：

        ```ts
        function parseNumber(value: unknown, sourceName: string): number {
          if (typeof value !== "number") {
            throw new Error(`Expected number in ${sourceName}`);
          }

          return value;
        }
        ```
      - 添加 `parseStopReason`。
      - 推荐形状：

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
      - 添加 `parseOptionalString`。
      - 推荐形状：

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
      - 保持 `usage` optional，因为有些 providers 不返回 token counts。
      - 保持 `errorMessage` optional，因为正常 assistant messages 没有它。
      - 加载 session 时，不要把缺失的 usage numbers 默认成 `0`；要么整个 `usage` object 不存在，要么三个 numbers 都有效。
  12. 把 `.chatrealm/` 加入 ignore rules。
      - 如果存在 `ChatRealm/.gitignore`，添加：

        ```text
        .chatrealm/
        ```
      - 如果没有 `ChatRealm/.gitignore`，把 `.chatrealm/` 添加到 repository `.gitignore`。
      - 这可以避免 local session files 被提交。
  13. 在 `src/main.ts` 接入 loading。
      - 导入：

        ```ts
        import { loadSessionMessages, saveSessionMessages } from "./session/store.js";
        ```
      - 创建 state 后、追加 new prompt 前：

        ```ts
        state.messages.push(...await loadSessionMessages({ cwd }));
        appendUserMessage(state, parsed.prompt);
        ```
      - 这样 `createAgentState` 仍然创建新的 run metadata。
      - 旧 messages 会在新 user message 之前加入，保留 conversation history。
  14. 在 `src/main.ts` 接入 saving。
      - `runAgentLoop` 成功 resolve 后，保存更新后的 messages：

        ```ts
        await saveSessionMessages({ cwd }, result.state.messages);
        ```
      - 保存可以在打印前，也可以在打印后；两者都可以。
      - 如果希望 persistence failure 明显地让命令失败，优先在打印前保存。
      - 如果 `runAgentLoop` throws，不要保存；TODO-013 可以决定是否保存 partial failed sessions。
  15. 思考 first-run behavior。
      - 如果没有 session file：
        - `loadSessionMessages` 返回 `[]`。
        - new user prompt 被追加。
        - agent 正常运行。
        - 写入新的 `.chatrealm/sessions/default.json`。
      - 如果 session file 已存在：
        - previous messages 先加载。
        - new user prompt 追加在后面。
        - model 能看到 prior conversation。
        - 更新后的文件替换旧 JSON。
  16. 不调用真实 provider 的 manual smoke check。
      - 可以用临时脚本直接测试 `store.ts`。
      - 在 `ChatRealm/` 中创建 `session-store-smoke.ts`。
      - 不要提交它。
      - 示例：

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
      - 从 `ChatRealm/` 运行：

        ```powershell
        npm exec tsx -- ./session-store-smoke.ts
        ```
      - 预期输出：

        ```text
        todo-012 smoke ok
        ```
      - 最后删除 scratch script：

        ```powershell
        Remove-Item .\session-store-smoke.ts
        ```
  17. Manual CLI check。
      - 运行一次成功的真实或 fake-provider command。
      - 确认这个文件存在：

        ```text
        <cwd>/.chatrealm/sessions/default.json
        ```
      - 打开它并确认包含：

        - `version`
        - `savedAt`
        - `messages`
      - 再运行第二个 prompt，确认文件现在包含两次运行的 messages。
  18. 运行类型检查。
      - 从 `ChatRealm/` 运行：

        ```powershell
        npm run check
        ```
      - 进入下一步前修复所有 TypeScript errors。
- 新手 notes：
  - 不要把 `AgentState.run` 作为 durable history 保存。它是 per-run metadata。
  - 只持久化 messages，可以让 follow-up behavior 保持简单。
  - JSON files 一旦在磁盘上存在，就是 external input，所以 load 时要 validate。
  - Pretty JSON 更适合学习和手动检查。
  - Session file 是 local workspace state，不是 source code。
- 验收标准：
  - `src/session/store.ts` 存在。
  - Session data 保存到相对于 effective `cwd` 的 `.chatrealm/sessions/default.json`。
  - 缺少 session file 时加载为空 history。
  - Invalid session JSON 抛出清晰错误。
  - Loaded messages 在 new user prompt 前追加到新的 `AgentState`。
  - 每次 CLI invocation 都有 fresh run metadata。
  - successful agent loop 后保存 updated messages。
  - `.chatrealm/` 被 git ignore。
  - 不持久化 API keys 或 provider credentials。
  - 没有添加数据库。
  - 没有添加 session UI。
  - 没有添加 compaction。
  - 没有使用 `any`。
  - 没有使用 dynamic imports。
  - 从 `ChatRealm/` 运行 `npm run check` 成功。
- Reviewer checklist：
  - 确认 persistence code 隔离在 `src/session/store.ts`。
  - 确认 `agent-loop.ts` 不读写磁盘。
  - 确认 session loading 不复用 stale `turnCount`。
  - 确认 session files 不会被提交。
  - 确认 corrupt session JSON 会明确失败，而不是被静默覆盖。

### TODO-013：添加错误处理和面向用户的输出

- 状态：pending
- 目标：把原始 thrown errors 替换成一个小而稳定的错误格式化层，让终端用户看到简短、有用的消息，并让程序用正确 exit code 退出。
- 范围：
  - 在 `src/utils/errors.ts` 中添加可复用的 error utility module。
  - 把常见失败归类到少量 user-facing categories。
  - 更新 `src/main.ts`，让 CLI usage/config/provider/session errors 统一打印。
  - tool execution errors 继续作为 agent loop 内部的 tool-result messages 返回，但文本要更简洁。
  - 保持实现很小；现在不要添加 logging frameworks、retry logic、telemetry 或 rich diagnostics。
- 不在范围内：
  - 不要添加正式测试；TODO-014 负责 test files。
  - 不要添加 streaming output。
  - 不要添加 TUI renderer。
  - 除非 agent loop 成功完成，否则不要保存 failed partial sessions。
  - 不要添加 provider-specific recovery 或 automatic retries。
- 可能涉及的文件或区域：`src/utils/errors.ts`、`src/main.ts`、`src/agent/agent-loop.ts`，可选 `src/session/store.ts`
- 依赖：TODO-011、TODO-012
- 新手心智模型：
  - 抛出 `Error` 会停止正常执行，并跳到最近的 `catch`。
  - `main().catch(...)` 是 CLI 的最后安全网。
  - 对 missing prompt 或 missing API key 这种正常可预期失败，不应该让用户看到 stack trace。
  - 开发者仍然希望代码清晰，所以只在一个地方分类并格式化错误。
  - Tool failures 和 CLI failures 不一样：tool 调用失败通常应该作为 `toolResult` 返回给模型，而不是让整个程序 crash。
- 本 MVP 的 error categories：
  - `usage`：用户命令用错了，比如 missing prompt 或 unknown option。
  - `config`：必要本地配置缺失或无效，比如 missing API key。
  - `provider`：模型 API request 失败或返回了无效 response。
  - `session`：session JSON 无法加载或验证失败。
  - `agent`：agent loop 失败，比如 max turns exhausted。
  - `tool`：模型使用本地 tool 时发生失败。
  - `unknown`：非 Error 值或意外失败到达 CLI 边界。
- 建议输出风格：
  - 对 expected failures，消息保持一行。
  - 给消息加短前缀：

    ```text
    Usage error: Missing prompt
    Config error: Missing API key. Set CHATREALM_API_KEY or apiKey in chatrealm.config.json
    Provider error: OpenAI-compatible request failed with 401
    Session error: Invalid JSON in C:/project/.chatrealm/sessions/default.json
    Agent error: Agent loop reached max turns (10) before a final answer
    ```

  - 默认不要打印 stack traces。
  - wrap error 时把原始 `Error` 保留在 `cause` 中。
- 分步实现指南：
  1. 创建 `src/utils/errors.ts`。
     - 这个文件只放通用 error helpers。
     - 不要在这里 import agent、provider、CLI 或 session modules。
     - 把这个文件理解成失败类型的小词汇表。
  2. 定义 category type。
     - 添加：

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

     - 这是 TypeScript union type。
     - 它表示只允许这些精确字符串。
     - 如果你写错成 `"confg"`，TypeScript 会报错。
  3. 定义格式化后的 CLI result type。
     - 添加：

       ```ts
       export interface FormattedCliError {
         message: string;
         exitCode: number;
       }
       ```

     - `message` 是 `main.ts` 打印到 `stderr` 的内容。
     - `exitCode` 是 `process.exitCode` 应该设置的值。
     - 本 MVP 中，除 help 已经成功退出外，所有失败都用 exit code `1`。
  4. 添加 `UserFacingError` class。
     - 使用显式字段，不要使用 TypeScript parameter properties。
     - 推荐形状：

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

     - 这个 class 的作用：
       - 让代码能表达“这个错误可以安全展示给用户”。
       - 它把 category 和 exit code 跟 message 放在一起。
       - 它仍然是普通 JavaScript `Error`。
     - 不要做的事：
       - 不要用 `any`。
       - 不要使用 `constructor(readonly category: ...)` 这种 parameter properties。
       - 不要在 class 里写 `console.error`。
  5. 添加 category label helper。
     - 添加：

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

     - 对新手来说，`switch` 比 map 更直观。
     - union type 很小，所以维护成本低。
  6. 添加 `formatCliError`。
     - 添加：

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

     - 这个函数接收 `unknown`，因为 JavaScript 可以 throw 任意值。
     - 它返回简单 object，这样 `main.ts` 不需要知道格式化规则。
  7. 添加一个小 wrapping helper。
     - 添加：

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

     - 这个 helper 适合包住 provider/session calls。
     - 保持简单。现在不要试图识别所有 provider error shape。
  8. 更新 `src/main.ts` imports。
     - 添加：

       ```ts
       import {
         UserFacingError,
         formatCliError,
         toUserFacingError,
       } from "./utils/errors";
       ```

     - 使用 ChatRealm 当前采用的无扩展名 import 风格。
  9. 更新 `src/main.ts` 的 top-level catch。
     - 把当前 catch body 替换为：

       ```ts
       main().catch((error: unknown) => {
         const formatted = formatCliError(error);
         console.error(formatted.message);
         process.exitCode = formatted.exitCode;
       });
       ```

     - 这段逻辑应该放在 `main.ts` 的原因：
       - `main.ts` 是 process boundary。
       - 只有 `main.ts` 应该决定什么内容到达 terminal。
       - 底层模块应该 throw useful errors，不应该直接 print。
  10. 把 expected CLI/config errors 转成 `UserFacingError`。
      - Missing prompt 改为：

        ```ts
        throw new UserFacingError("usage", "Missing prompt");
        ```

      - Unsupported provider 改为：

        ```ts
        throw new UserFacingError("usage", `Unsupported provider: ${provider}`);
        ```

      - Missing API key 改为：

        ```ts
        throw new UserFacingError(
          "config",
          "Missing API key. Set CHATREALM_API_KEY or apiKey in chatrealm.config.json",
        );
        ```

      - 这些都是用户可以修正的 expected failures，所以不应显示为 `Unexpected error`。
  11. 包住 session loading。
      - `loadSessionMessages` 可能因为 JSON corrupt 或 shape 错误而失败。
      - 在 `main.ts` 中只包住 load call：

        ```ts
        let savedMessages;

        try {
          savedMessages = await loadSessionMessages({ cwd });
        } catch (error) {
          throw toUserFacingError("session", error, "Failed to load session");
        }

        state.messages.push(...savedMessages);
        ```

      - 如果 TypeScript inference 让你困惑，可以 import `Message` type 后写：

        ```ts
        let savedMessages: Message[] = [];
        ```

      - 不要在这里 catch 整个 `main()`；只包住你想分类的那一步操作。
  12. 包住 provider/agent loop 边界。
      - `runAgentLoop` 可能因为这些原因失败：
        - provider request failed
        - provider response invalid
        - max turns exhausted
      - MVP 先保持简单：
        - 如果 error message 以 `Agent loop reached max turns` 开头，归类为 `agent`
        - 否则归类为 `provider`
      - 推荐形状：

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

      - 这不完美，但对 MVP 足够。
      - 除非已经真的需要，否则不要添加 custom provider error classes。
  13. 包住 session saving。
      - 如果模型完成后保存失败，清楚告诉用户：

        ```ts
        try {
          await saveSessionMessages({ cwd }, result.state.messages);
        } catch (error) {
          throw toUserFacingError("session", error, "Failed to save session");
        }
        ```

      - 这意味着如果保存失败，成功的模型回答可能不会打印。
      - 对 MVP 来说可以接受，因为 TODO-012 之后 persistence 是 command contract 的一部分。
  14. Tool errors 留在 `agent-loop.ts` 里面。
      - `executeToolCall` 已经 catch tool failures 并追加 `toolResult`。
      - 如果需要，只改进 formatting helper。
      - 一个好的 MVP tool error 文本：

        ```text
        Tool error: <message>
        ```

      - 推荐 helper：

        ```ts
        function formatToolExecutionError(error: unknown): string {
          if (error instanceof Error) {
            return `Tool error: ${error.message}`;
          }

          return `Tool error: ${String(error)}`;
        }
        ```

      - 普通 tool failures 不要从 `executeToolCall` throw。
      - 模型需要看到 tool error，才能恢复或解释。
  15. 手动检查：help 仍然成功。
      - 从 `ChatRealm/` 运行：

        ```powershell
        npm run dev -- --help
        ```

      - 预期：
        - usage text 打印到 stdout
        - process 成功退出
        - 不出现 `Usage error:` 前缀
  16. 手动检查：missing prompt。
      - 运行：

        ```powershell
        npm run dev
        ```

      - 预期 stderr：

        ```text
        Usage error: Missing prompt
        ```

      - 预期 exit code：`1`。
  17. 手动检查：unsupported provider。
      - 运行：

        ```powershell
        npm run dev -- -p "hi" --provider fake
        ```

      - 预期 stderr：

        ```text
        Usage error: Unsupported provider: fake
        ```
  18. 手动检查：missing API key。
      - 只有当你没有设置 `CHATREALM_API_KEY`，且 config file 里没有 `apiKey` 时运行：

        ```powershell
        npm run dev -- -p "hi"
        ```

      - 预期 stderr：

        ```text
        Config error: Missing API key. Set CHATREALM_API_KEY or apiKey in chatrealm.config.json
        ```

      - 如果你已经配置了 API key，可以临时在干净 temp directory 运行，或把 `CHATREALM_CONFIG` 指向一个不存在的 temp file 来检查。
  19. 手动检查：corrupt session JSON。
      - 在项目外创建一个临时目录。
      - 在里面创建 `.chatrealm/sessions/default.json`，内容写成 invalid JSON，例如：

        ```json
        {
        ```

      - 使用 `--cwd` 指向这个 temp directory，并传一个 fake 或 real API key value：

        ```powershell
        npm run dev -- -p "hi" --cwd "C:\path\to\temp"
        ```

      - 预期 stderr 以这段开头：

        ```text
        Session error:
        ```

      - 检查后清理 temp directory。
  20. 可选 real-provider check。
      - 只有当你有有效 API key，并接受发起一次模型请求时运行：

        ```powershell
        npm run dev -- -p "Say exactly: ok"
        ```

      - 预期：
        - 正常 assistant output 打印到 stdout
        - 不出现 error prefix
        - 成功后 session file 仍然保存
  21. 运行类型检查。
      - 从 `ChatRealm/` 运行：

        ```powershell
        npm run check
        ```

      - 从 repository root 再运行：

        ```powershell
        npm run check
        ```

      - 进入下一个 TODO 前修复所有 errors。
- 最小预期文件内容：
  - `src/utils/errors.ts` 导出 `UserFacingError`、`formatCliError` 和 `toUserFacingError`。
  - `src/main.ts` 通过 `formatCliError` 格式化所有 top-level errors。
  - `src/main.ts` 对 expected usage/config failures 抛出 `UserFacingError`。
  - `src/main.ts` 把 session load/save failures wrap 为 `session`。
  - `src/main.ts` 把 provider 或 loop failures wrap 为 `provider` 或 `agent`。
  - `src/agent/agent-loop.ts` 继续把 tool failures 保留在 `toolResult` messages 中。
- 验收标准：
  - `--help` 仍然打印 help 并成功退出。
  - Missing prompt 打印 `Usage error: Missing prompt`。
  - Unsupported provider 打印 `Usage error: Unsupported provider: <name>`。
  - Missing API key 打印 `Config error: ...`。
  - Corrupt session JSON 打印 `Session error: ...`，而不是静默覆盖该文件。
  - Max-turn exhaustion 打印 `Agent error: ...`。
  - Provider request failures 打印 `Provider error: ...`。
  - Tool execution failures 被返回为 tool-result content，不会自己 crash process。
  - Expected failures 不打印 stack trace。
  - 不使用 `any`。
  - 不使用 dynamic imports。
  - 从 `ChatRealm/` 执行 `npm run check` 成功。
  - 从 repository root 执行 root `npm run check` 成功。
- Reviewer checklist：
  - 确认 `src/utils/errors.ts` 没有 import application modules。
  - 确认只有 `main.ts` 打印 top-level errors。
  - 确认 expected user mistakes 没有被标成 unknown errors。
  - 确认 session corruption 会 loud failure，并且不会覆盖 corrupt file。
  - 确认 agent loop 仍然把 tool errors 返回给模型。
  - 确认没有新增 retry、logging、telemetry 或 TUI 行为。

### TODO-014：添加聚焦 MVP 测试

- 状态：completed
- 范围：覆盖 CLI parsing、registry lookup、fake-provider agent loop、max-turn handling 和 tool error propagation。
- 完成说明：
  - 已添加聚焦的 Node test runner 覆盖：CLI parsing、registry 行为、fake-provider agent loop、max-turn exhaustion 和 tool execution error propagation。
  - 已添加 `test:unit` 脚本，并把 test files 纳入 TypeScript checking。
  - 已规范 session store smoke 的 import，使 root relative-import check 通过。
  - 验证已通过：在 `ChatRealm/` 下执行 `npm run test:unit`，在 `ChatRealm/` 下执行 `npm run check`，以及在 repository root 执行 `npm run check`。
- 可能涉及的文件或区域：[ChatRealm/test/cli-args.test.ts](../ChatRealm/test/cli-args.test.ts)、[ChatRealm/test/tool-registry.test.ts](../ChatRealm/test/tool-registry.test.ts)、[ChatRealm/test/agent-loop.test.ts](../ChatRealm/test/agent-loop.test.ts)、[ChatRealm/package.json](../ChatRealm/package.json)、[ChatRealm/tsconfig.json](../ChatRealm/tsconfig.json)、[ChatRealm/session-store-smoke.ts](../ChatRealm/session-store-smoke.ts)
- 依赖：TODO-002、TODO-006、TODO-010、TODO-013

### TODO-015：编写 MVP 使用文档

- 状态：completed
- 范围：记录 setup、environment variables、example commands、current limitations 和后续 architecture milestones。
- 完成说明：
  - 已添加 MVP 使用文档，覆盖 setup、configuration sources、environment variables、example commands、local tools、session persistence、current limitations 和后续 architecture milestones。
  - 本次是 documentation-only change；此 TODO 不需要运行 code verification command。
- 可能涉及的文件或区域：[ChatRealm/README.md](../ChatRealm/README.md)
- 依赖：TODO-011、TODO-014

## TODO 项之间的依赖关系

- TODO-001 必须最先完成。
- TODO-002 和 TODO-003 准备可执行配置。
- TODO-004 和 TODO-005 创建 AI 边界。
- TODO-006 到 TODO-008 创建工具边界。
- TODO-009 和 TODO-010 创建核心 agent 行为。
- TODO-011 产出第一个可用 MVP。
- TODO-012 到 TODO-015 强化并文档化 MVP。

## 下一个可执行项

- 无。MVP TODO 计划已没有剩余计划项。

## 假设

- MVP 将作为当前 workspace 下独立的 `ChatRealm` 学习项目构建。
- TypeScript 是首选技术栈，因为 `pi` 基于 TypeScript，架构经验可以直接迁移。
- 第一个可用 agent 应优先实现 print mode，而不是 TUI，因为它能以少很多的 UI 复杂度暴露真实 agent loop。
- 工具执行应是本地且显式的；remote sandboxes、approval systems 和 plugin loading 延后。

## 风险

- 不同 provider 的 tool-call response formats 不同；MVP 应从一个 OpenAI 兼容 API 开始。
- Shell 和 write-file tools 如果过早开放可能不安全；在广泛使用前应先实现 path confinement 和清晰 command output。
- 完整 TUI 可能分散对 agent architecture 的学习；应等核心 loop 被理解后再做。
