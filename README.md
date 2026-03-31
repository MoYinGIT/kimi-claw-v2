# KIMI CLAW v2 🦾

**Complete Agent system inspired by Claude Code architecture.**

Multi-turn reasoning • MCP Protocol • Multi-Agent Collaboration • Smart Context Management

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](./package.json)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

---

## ✨ Key Features

- 🤖 **Agent Loop** - Multi-turn reasoning with thought → tool → observation cycles
- 🧠 **Smart Context Compression** - 4 strategies: sliding window, selective, summarize, hierarchical
- 🔌 **MCP Protocol** - Model Context Protocol server/client support
- 👥 **Multi-Agent** - Parallel/hierarchical/pipeline agent collaboration
- 🔧 **Tool System** - Extensible framework with 6 built-in tools
- 🔐 **Permission System** - 5-level permission model
- 📄 **CLAUDE.md Support** - Auto-load workspace context hierarchically
- 💾 **Session Persistence** - JSONL storage with `/fork` and `/continue`

---

## Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/moyin/kimi-claw-v2.git
cd kimi-claw-v2

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

### Basic Usage

```typescript
import { KIMI_CLAW } from 'kimi-claw-v2';

// Initialize Agent
const kimi = new KIMI_CLAW({
  enableAgentLoop: true,
  autoLoadCLAUDE: true
});

// Single tool execution
const result = await kimi.execute('WebSearchTool', {
  query: 'Latest AI news'
});

// Agent mode - multi-turn reasoning
const state = await kimi.runAgent(
  'Search for Claude Code updates and summarize key changes'
);

console.log(`Completed in ${state.steps.length} steps`);
```

### Agent Event Handling

```typescript
kimi.setAgentHandlers({
  onStep: (step) => {
    console.log(`[${step.type}] ${step.content.substring(0, 50)}...`);
  },
  onComplete: (state) => {
    console.log('✅ Agent completed successfully!');
  },
  onError: (error) => {
    console.error('❌ Agent error:', error.message);
  }
});
```

### MCP Protocol Support

```typescript
const kimi = new KIMI_CLAW({ enableMCP: true });

// Handle MCP requests
const response = await kimi.handleMCPRequest({
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: { 
    name: 'WebSearchTool', 
    arguments: { query: 'AI frameworks' } 
  }
});
```

### Multi-Agent Collaboration

```typescript
const kimi = new KIMI_CLAW({ enableMultiAgent: true });

// Register specialized agents
kimi.registerAgent({
  id: 'researcher',
  name: 'Research Agent',
  role: 'researcher',
  capabilities: ['search', 'summarize']
});

kimi.registerAgent({
  id: 'coder',
  name: 'Code Agent',
  role: 'developer',
  capabilities: ['code', 'debug']
});

// Assign tasks
const task1 = kimi.assignTask({
  agentId: 'researcher',
  task: 'Research latest AI frameworks',
  priority: 'high'
});

const task2 = kimi.assignTask({
  agentId: 'coder',
  task: 'Create sample implementation',
  priority: 'medium'
});

// Execute in parallel
const results = await kimi.executeTasks(
  [task1.taskId, task2.taskId],
  'parallel'  // or 'sequential', 'pipeline', 'hierarchical'
);
```

### Session Management

```typescript
// Fork session at current point
const forked = kimi.forkSession();

// Continue previous session
kimi.continueSession('20260401-abcd');

// List all sessions
const sessions = kimi.listSessions();
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    KIMI CLAW v2                        │
├─────────────────────────────────────────────────────────┤
│  Agent Loop → Think → Decide → Execute → Observe       │
├─────────────────────────────────────────────────────────┤
│  MCP Server ←→ External MCP Clients                    │
├─────────────────────────────────────────────────────────┤
│  Multi-Agent Coordinator                               │
│  ├─ Researcher Agent                                   │
│  ├─ Code Agent                                         │
│  └─ Review Agent                                       │
├─────────────────────────────────────────────────────────┤
│  Tool Registry (6 built-in tools)                      │
├─────────────────────────────────────────────────────────┤
│  Session Manager (JSONL) + CLAUDE.md Loader            │
└─────────────────────────────────────────────────────────┘
```

---

## Agent Loop Flow

```
User Query
    ↓
┌─────────────────────────────────────┐
│  1. THINK: Analyze the query        │
│     ↓                               │
│  2. DECIDE: Choose tool/action      │
│     ↓                               │
│  3. EXECUTE: Run tool               │
│     ↓                               │
│  4. OBSERVE: Process result         │
│     ↓                               │
│  5. LOOP or COMPLETE                │
└─────────────────────────────────────┘
    ↓
Final Answer
```

---

## Configuration

### Permissions (`~/.kimi-claw/permissions.json`)

```json
{
  "version": "1.0.0",
  "rules": {
    "alwaysAllow": ["WebSearchTool", "FileReadTool"],
    "alwaysAsk": ["BashTool", "AgentTool", "FileWriteTool"],
    "alwaysDeny": []
  },
  "settings": {
    "defaultPermissionLevel": "ask",
    "logAllExecutions": true
  }
}
```

### Agent Config

```typescript
const kimi = new KIMI_CLAW({
  enableAgentLoop: true,
  agentConfig: {
    maxSteps: 10,              // Max reasoning steps
    maxTokens: 8000,           // Context window size
    autoApproveTools: ['WebSearchTool'],
    requireConfirmation: true,
    stopOnError: true
  }
});
```

### MCP Config

```typescript
const kimi = new KIMI_CLAW({
  enableMCP: true
  // MCP server starts automatically
});
```

### Multi-Agent Config

```typescript
const kimi = new KIMI_CLAW({
  enableMultiAgent: true,
  multiAgentConfig: {
    maxAgents: 10,
    maxConcurrentTasks: 5,
    defaultStrategy: 'parallel'
  }
});
```

---

## Available Tools

| Tool | Category | Permission | Description |
|:---|:---|:---:|:---|
| WebSearchTool | SEARCH | low | Web search |
| FileReadTool | FILE | low | Read files |
| FileWriteTool | FILE | medium | Write files |
| AgentTool | AGENT | high | Spawn sub-agents |
| BashTool | EXEC | high | Execute shell commands |
| MessageTool | MESSAGE | medium | Send messages |

---

## Context Compression Strategies

| Strategy | Description | Use Case |
|:---|:---|:---|
| sliding_window | Keep most recent N messages | General purpose |
| selective | Keep based on importance score | Critical steps |
| summarize | Generate summary of old messages | Long conversations |
| hierarchical | Multi-level summary | Very long context |

---

## Roadmap

| Phase | Features | Status |
|:---|:---|:---:|
| Phase 1 | Tool system, permissions | ✅ Complete |
| Phase 2 | CLAUDE.md, sessions | ✅ Complete |
| Phase 3 | Agent Loop, context compression | ✅ Complete |
| Phase 4 | MCP protocol, multi-agent | ✅ Complete |
| **Phase 5** | **Documentation, release** | **✅ Complete** |

---

## Development

```bash
# Build
npm run build

# Test
npm test

# Generate API docs
npm run docs

# Watch mode
npm run dev
```

---

## API Documentation

See [API Docs](./docs/api/index.html) (generated by TypeDoc)

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)

---

## License

MIT © 2026 MoYin

---

> 「The true power of an Agent lies not in its tools, but in its ability to reason, decide, and act autonomously.」
