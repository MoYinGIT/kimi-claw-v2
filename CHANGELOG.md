# Changelog

All notable changes to KIMI CLAW v2 will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-04-01

### 🎉 Release

KIMI CLAW v2 is now complete with full feature parity to Claude Code core functionality.

### ✨ Added

#### Phase 1: Core Foundation (P0)
- Tool abstraction system with base `Tool` class
- Tool registry for centralized tool management
- Tool executor with permission checking
- 6 built-in tools: WebSearch, FileRead, FileWrite, Agent, Bash, Message
- 5-level permission system (none, low, medium, high, critical)
- Permission configuration file (`~/.kimi-claw/permissions.json`)
- 15 integration tests

#### Phase 2: Productivity Features (P1)
- CLAUDE.md auto-loading with hierarchical inheritance
- Session persistence using JSONL format
- `/fork` command - Create session branches at any message
- `/continue` command - Resume previous sessions
- Session index management
- Export to Markdown/JSON

#### Phase 3: Agent Intelligence (P2)
- **Agent Loop** - Multi-turn reasoning engine
  - Think → Decide → Execute → Observe → Loop/Complete
  - Event system (onStep, onComplete, onError)
  - Configurable max steps and token limits
  - Graceful error handling
- **Context Compression** - 4 compression strategies
  - Sliding window
  - Selective (importance-based)
  - Summarize
  - Hierarchical
- Smart context manager with automatic threshold-based compression

#### Phase 4: Ecosystem (P3)
- **MCP Protocol Support**
  - MCPServer - Expose tools as MCP endpoints
  - MCPClient - Connect to external MCP servers
  - Support for `tools/list`, `tools/call`, `server/info`, `server/health`
  - Tool whitelist and authentication
- **Multi-Agent Collaboration**
  - MultiAgentCoordinator for task orchestration
  - 4 collaboration strategies: sequential, parallel, pipeline, hierarchical
  - Agent registration with capabilities
  - Task assignment with dependencies
  - Agent-to-agent messaging
  - Broadcast support

#### Phase 5: Documentation & Release (P4)
- Comprehensive README with examples
- API documentation (TypeDoc)
- CHANGELOG
- Project structure documentation

### 📊 Statistics

| Metric | Value |
|:---|:---:|
| Total Lines of Code | ~10,500 |
| Files | 25 |
| Core Modules | 10 |
| Built-in Tools | 6 |
| Test Coverage | Integration tests (15) |

### 🎯 Claude Code Alignment

| Feature | Status |
|:---|:---:|
| Tool Abstraction | ✅ 100% |
| Permission System | ✅ 100% |
| Configuration | ✅ 100% |
| CLAUDE.md Loading | ✅ 100% |
| Session Persistence | ✅ 100% |
| fork/continue | ✅ 100% |
| Agent Loop | ✅ 100% |
| Context Compression | ✅ 100% |
| MCP Protocol | ✅ 100% |
| Multi-Agent Collaboration | ✅ 100% |

**Overall Alignment: 100% (10/10 core features)**

### 🏗️ Architecture

```
kimi-claw-v2/
├── src/
│   ├── core/
│   │   ├── AgentLoop.ts              # Multi-turn reasoning
│   │   ├── ContextCompressor.ts      # Context management
│   │   ├── MCPServer.ts              # MCP protocol
│   │   ├── MultiAgentCoordinator.ts  # Multi-agent coordination
│   │   ├── Tool.ts                   # Tool abstraction
│   │   ├── ToolRegistry.ts           # Tool registry
│   │   ├── ToolExecutor.ts           # Tool execution
│   │   ├── PermissionManager.ts      # Permission management
│   │   ├── CLAUDELoader.ts           # CLAUDE.md loading
│   │   ├── SessionManager.ts         # Session persistence
│   │   └── index.ts
│   ├── tools/                         # Built-in tools
│   │   ├── WebSearchTool.ts
│   │   ├── FileReadTool.ts
│   │   ├── FileWriteTool.ts
│   │   ├── AgentTool.ts
│   │   ├── BashTool.ts
│   │   └── MessageTool.ts
│   └── index.ts
├── test/
│   └── integration.test.ts
├── docs/
│   └── api/                           # Generated API docs
├── CLAUDE.md                          # Project context
├── README.md                          # Main documentation
├── CHANGELOG.md                       # This file
├── package.json
└── typedoc.json
```

### 📝 API Highlights

```typescript
// Initialize KIMI CLAW
const kimi = new KIMI_CLAW({
  enableAgentLoop: true,
  enableMCP: true,
  enableMultiAgent: true,
  autoLoadCLAUDE: true
});

// Run Agent
const state = await kimi.runAgent('Search and summarize AI news');

// MCP Request
const response = await kimi.handleMCPRequest({
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list'
});

// Multi-Agent
kimi.registerAgent({ id: 'coder', role: 'developer', ... });
const task = kimi.assignTask({ agentId: 'coder', task: '...' });
const results = await kimi.executeTasks([task.taskId], 'parallel');
```

### 🔧 Configuration Files

- `~/.kimi-claw/permissions.json` - Permission rules
- `~/.kimi-claw/sessions/` - Session storage
- `CLAUDE.md` - Project context (per-directory)

### 🙏 Acknowledgments

- Inspired by [Claude Code](https://claude.ai/code) by Anthropic
- Architecture influenced by MCP (Model Context Protocol)
- Built with TypeScript ❤️

---

[2.0.0]: https://github.com/moyin/kimi-claw-v2/releases/tag/v2.0.0
