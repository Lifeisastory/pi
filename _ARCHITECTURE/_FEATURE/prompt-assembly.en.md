# Feature Implementation Record: prompt-assembly

## Metadata
- feature: Prompt assembly (system prompt construction + dynamic injection + Context build for LLM)
- project_root: D:/My/Project/pi
- architecture_index: _ARCHITECTURE/ARCHITECTURE.en.md
- analysis_scope: How pi builds the system prompt in 7 ordered sections, injects dynamic context, and assembles the final Context sent to the model.
- output_date: 2026-07-01
- confidence: high

## Entry Points
- symbol: buildSystemPrompt
  file: packages/coding-agent/src/core/system-prompt.ts
  lines: 28-175
  role: Single implementation that concatenates the 7 system-prompt sections.
- symbol: _rebuildSystemPrompt
  file: packages/coding-agent/src/core/agent-session.ts
  lines: 878-911
  role: Gathers resources (skills, context files, tool snippets) and calls buildSystemPrompt; writes agent.state.systemPrompt.
- symbol: streamAssistantResponse
  file: packages/agent/src/agent-loop.ts
  lines: 275-308
  role: Assembles Context = {systemPrompt, messages, tools} and dispatches to the model.

## Core Flow
1. step: Tool set / resources change triggers rebuild.
   file: packages/coding-agent/src/core/agent-session.ts
   lines: 878-911
   symbols: _rebuildSystemPrompt
   summary: Collect customPrompt(getSystemPrompt), skills, agentsFiles, tool snippets/guidelines into BuildSystemPromptOptions.
   evidence: loaderSystemPrompt = resourceLoader.getSystemPrompt()
2. step: Normalize cwd and compute date.
   file: packages/coding-agent/src/core/system-prompt.ts
   lines: 39-46
   symbols: promptCwd, date
   summary: Backslashes -> forward slashes; date as YYYY-MM-DD.
   evidence: resolvedCwd.replace(/\\/g, "/")
3. step: Build intro (default hardcoded or customPrompt) + tools + guidelines.
   file: packages/coding-agent/src/core/system-prompt.ts
   lines: 88-149
   symbols: visibleTools, addGuideline
   summary: Only tools with a snippet appear; guidelines are tool-derived + custom + fixed, deduped.
   evidence: visibleTools = tools.filter(name => !!toolSnippets?.[name]) (91)
4. step: Append appendSystemPrompt section.
   file: packages/coding-agent/src/core/system-prompt.ts
   lines: 48, 151-153
   symbols: appendSection
   summary: Optional extra text.
   evidence: prompt += appendSection
5. step: Append project context files.
   file: packages/coding-agent/src/core/system-prompt.ts
   lines: 155-163
   symbols: contextFiles, <project_context>, <project_instructions>
   summary: CLAUDE.md/AGENTS.md contents wrapped per-file in XML.
   evidence: `<project_instructions path="${filePath}">`
6. step: Append skills section (requires read tool).
   file: packages/coding-agent/src/core/system-prompt.ts
   lines: 165-168
   symbols: formatSkillsForPrompt
   summary: <available_skills> with name/description/location; index-only, model reads full file on demand.
   evidence: if (hasRead && skills.length > 0)
7. step: Append current date and cwd.
   file: packages/coding-agent/src/core/system-prompt.ts
   lines: 170-172
   symbols: n/a
   summary: Always last.
   evidence: prompt += `\nCurrent working directory: ${promptCwd}`
8. step: Write result to agent state.
   file: packages/coding-agent/src/core/agent-session.ts
   lines: 796-797
   symbols: agent.state.systemPrompt
   summary: Base system prompt stored for the loop.
   evidence: this.agent.state.systemPrompt = this._baseSystemPrompt
9. step: Per turn, convert history and assemble Context, then dispatch.
   file: packages/agent/src/agent-loop.ts
   lines: 275-308
   symbols: transformContext, convertToLlm, Context, streamFunction
   summary: Context = {systemPrompt, messages(llm), tools}; sent via streamFunction.
   evidence: streamFunction(config.model, llmContext, {...}) (304)

## Key Symbols
- symbol: buildSystemPrompt
  kind: function
  file: packages/coding-agent/src/core/system-prompt.ts
  lines: 28-175
  role: 7-section system prompt assembly; two branches (customPrompt vs default).
  used_by: _rebuildSystemPrompt
  calls_into: formatSkillsForPrompt, getReadmePath/getDocsPath/getExamplesPath
- symbol: formatSkillsForPrompt
  kind: function
  file: packages/coding-agent/src/core/skills.ts
  lines: 335-361
  role: Emit <available_skills> XML (name/description/location); skips disableModelInvocation.
  used_by: buildSystemPrompt
  calls_into: escapeXml
- symbol: _rebuildSystemPrompt
  kind: method
  file: packages/coding-agent/src/core/agent-session.ts
  lines: 878-911
  role: Assemble options from ResourceLoader and rebuild base prompt.
  used_by: AgentSession (on tool/resource change)
  calls_into: buildSystemPrompt, resourceLoader.getSkills/getAgentsFiles/getSystemPrompt
- symbol: streamAssistantResponse
  kind: function
  file: packages/agent/src/agent-loop.ts
  lines: 275-308
  role: Build LLM Context and dispatch stream.
  used_by: agent loop
  calls_into: transformContext, convertToLlm, streamSimple/streamFn
- symbol: loadContextFileFromDir
  kind: function
  file: packages/coding-agent/src/core/resource-loader.ts
  lines: 57-113
  role: Find AGENTS.md/CLAUDE.md (+uppercase) across agentDir/cwd/ancestors.
  used_by: ResourceLoader.getAgentsFiles
  calls_into: existsSync, readFileSync

## State and Data Changes
- location: packages/coding-agent/src/core/agent-session.ts:796-797
  mutation: agent.state.systemPrompt = rebuilt base prompt.
  purpose: Provide current system prompt to the agent loop.
  triggered_by: _rebuildSystemPrompt
- location: packages/coding-agent/src/core/system-prompt.ts:96-130
  mutation: guidelinesList/guidelinesSet accumulate deduped guidelines.
  purpose: Compose tool-aware guidance without duplicates.
  triggered_by: buildSystemPrompt

## Decision Points
- condition: customPrompt provided
  location: packages/coding-agent/src/core/system-prompt.ts:53
  effect_if_true: Use custom intro; skip default intro + pi-docs hint.
  effect_if_false: Use hardcoded default intro incl. pi documentation hint (132-149).
- condition: tool has a snippet in toolSnippets
  location: packages/coding-agent/src/core/system-prompt.ts:91-93
  effect_if_true: Tool listed under Available tools.
  effect_if_false: Tool omitted (even if in selectedTools); list shows "(none)" if empty.
- condition: read tool available AND skills non-empty
  location: packages/coding-agent/src/core/system-prompt.ts:166
  effect_if_true: Append <available_skills>.
  effect_if_false: No skills section.
- condition: bash present without grep/find/ls
  location: packages/coding-agent/src/core/system-prompt.ts:113-117
  effect_if_true: Guideline "Use bash for file operations".
  effect_if_false: If grep/find/ls present, prefer-those guideline.

## Side Effects
- effect: Synchronous filesystem reads of CLAUDE.md/AGENTS.md.
  location: packages/coding-agent/src/core/resource-loader.ts:57-73
  when: ResourceLoader loads context files (readFileSync).
- effect: LLM stream request.
  location: packages/agent/src/agent-loop.ts:304
  when: Each assistant turn.

## Related Files
- file: packages/coding-agent/src/core/system-prompt.ts
  relevance: primary
  reason: The 7-section assembly.
- file: packages/coding-agent/src/core/agent-session.ts
  relevance: primary
  reason: Rebuild + write-back of system prompt.
- file: packages/agent/src/agent-loop.ts
  relevance: primary
  reason: Context assembly and dispatch.
- file: packages/coding-agent/src/core/resource-loader.ts
  relevance: secondary
  reason: Loads project instructions, skills, appendSystemPrompt.
- file: packages/coding-agent/src/core/skills.ts
  relevance: secondary
  reason: Skills XML formatting.
- file: packages/agent/src/harness/messages.ts
  relevance: secondary
  reason: convertToLlm history conversion (intersection with memory system).
- file: packages/agent/src/harness/prompt-templates.ts
  relevance: context-only
  reason: Slash-command user-message templates (not system prompt).

## Open Questions
- question: Exact source of ResourceLoader.getSystemPrompt() customPrompt (which config file/field).
  status: unresolved
  note: Used as customPrompt in _rebuildSystemPrompt; loader init not traced this pass.
- question: How tool promptSnippet/promptGuidelines are registered per ToolDefinition.
  status: partially-answered
  note: Consumed via _toolPromptSnippets/_toolPromptGuidelines maps (agent-session.ts ~2285-2300); registration site not fully traced.

## Inferences
- statement: System prompt is rebuilt whenever the active tool set changes.
  basis: _rebuildSystemPrompt takes toolNames and is the write path to agent.state.systemPrompt.

## Retrieval Hints
- If asked "what's in the system prompt / in what order", start from buildSystemPrompt (system-prompt.ts:28-175).
- If asked "is git status / platform injected", answer NO — only date + cwd (system-prompt.ts:170-172); no env injection.
- If asked "how are CLAUDE.md/AGENTS.md loaded", start from resource-loader.ts:57-113 + system-prompt.ts:155-163.
- If asked "why is a tool missing from the prompt", check toolSnippets/visibleTools (system-prompt.ts:88-93).
- If asked "how are skills advertised", start from formatSkillsForPrompt (skills.ts:335-361).
- If asked "where is the final message array built for the model", start from streamAssistantResponse (agent-loop.ts:275-308).
