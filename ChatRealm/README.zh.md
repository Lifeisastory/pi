# ChatRealm

ChatRealm 是一个轻量级的 TypeScript 编码助手 MVP（最小可行产品），受 `pi` 架构启发。它在终端中以打印模式运行，向兼容 OpenAI 的对话补全提供商发送一条提示，让模型调用一组小型本地工具，将对话历史保存为 JSON 文件，并打印最终的助手回复文本。

本项目是一个学习用途的实现，并非生产级代理程序。

## 安装

在 ChatRealm 目录下安装依赖：

```powershell
cd ChatRealm
npm install --ignore-scripts
```

暴露本地终端命令：

```powershell
npm link --ignore-scripts
```

链接完成后，可以直接运行 ChatRealm：

```powershell
chatrealm --help
```

检查 TypeScript：

```powershell
npm run check
```

运行聚焦的 MVP 测试：

```powershell
npm run test:unit
```

## 配置

ChatRealm 通过环境变量和可选的 JSON 配置文件读取配置。

默认配置文件：

```text
chatrealm.config.json
```

自定义配置文件路径：

```powershell
$env:CHATREALM_CONFIG = "C:\path\to\chatrealm.config.json"
```

支持的环境变量：

```text
CHATREALM_API_KEY   必需（除非在配置文件中设置了 apiKey）。
CHATREALM_BASE_URL  可选的兼容 OpenAI 的基础 URL。
CHATREALM_MODEL     可选的模型覆盖。
CHATREALM_CWD       可选的代理工作目录。
```

支持的 JSON 配置键：

```json
{
  "apiKey": "your-api-key",
  "baseUrl": "https://api.openai.com/v1",
  "model": "gpt-4.1-mini",
  "cwd": "D:/path/to/workspace"
}
```

优先级顺序：

1. CLI 标志覆盖运行时默认值（如果有标志的话）。
2. 环境变量覆盖 JSON 配置值。
3. JSON 配置值覆盖内置默认值。
4. `cwd` 默认为当前进程目录。
5. `model` 默认为 `gpt-4.1-mini`。

目前唯一支持的提供商名称为 `openai-compatible`。

## 命令

显示帮助：

```powershell
chatrealm --help
```

进入交互模式：

```powershell
chatrealm
```

在交互模式下，助手文本会流式输出到终端。工具调用仍会作为完整的模型消息收集后再执行。

交互模式支持以下斜杠命令：

```text
/help
/exit
/quit
```

使用显式提示运行：

```powershell
chatrealm -p "Say exactly: ok"
```

使用位置参数提示文本运行：

```powershell
chatrealm write a short summary of this project
```

覆盖模型和工作目录：

```powershell
chatrealm -p "Inspect the project" --model gpt-4.1-mini --cwd D:\My\Project\pi\ChatRealm
```

显式选择提供商：

```powershell
chatrealm -p "Say hi" --provider openai-compatible
```

## 本地工具

ChatRealm 向模型暴露以下工具：

```text
read_file      读取代理工作目录内的 UTF-8 文本文件。
search         在代理工作目录内搜索 UTF-8 文本文件。
write_file     在代理工作目录内写入 UTF-8 文本文件。
shell_command  在代理工作目录内运行 shell 命令。
```

文件工具会解析配置的 `cwd` 内的路径。Shell 工具在本地运行命令，带有超时限制，并返回 stdout、stderr 和退出码。

## 会话

成功完成一次代理循环后，ChatRealm 将消息历史保存到：

```text
<cwd>/.chatrealm/sessions/default.json
```

下次使用相同的 `cwd` 运行时，ChatRealm 会先加载该文件，然后再追加新的用户提示。如果会话 JSON 文件损坏或形状不受支持，CLI 会输出 `Session error:` 消息并退出，而不会覆盖它。

仓库根目录下的 `.gitignore` 会忽略 `ChatRealm/.chatrealm/`，但如果使用了不同的 `--cwd`，则可能在项目外部创建 `.chatrealm/` 目录。

## 当前限制

- 仅有打印模式和基本交互模式，没有 TUI 或 RPC 模式。
- 交互模式会流式输出助手文本，但打印模式仍然等待最终响应。
- 只有一条兼容 OpenAI 的提供商路径，没有提供商注册机制。
- 工具执行没有审批流程。
- Shell 工具在配置的工作目录中运行本地命令。
- 会话持久化为单个 JSON 文件，没有压缩功能。
- 没有插件系统、技能系统、沙箱服务或市场。
- 失败的代理循环不会保存部分会话。
- 该包为私有包，未准备用于二进制分发。

## 架构里程碑

MVP 之后有用的下一步计划：

1. 添加提供商注册机制，使提供商选择不再硬编码。
2. 在写入和 Shell 操作之前添加工具审批或策略检查。
3. 为提供商文本增量添加流式输出。
4. 添加会话压缩和命名会话功能。
5. 在打印模式行为稳定后，添加小型 TUI。
6. 仅在运行时合约稳定后再进行打包。
