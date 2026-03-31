#!/bin/bash
# KIMI CLAW v2 - GitHub Push Setup Script
# Run this script on your Mac to create and push the project

set -e

echo "🚀 KIMI CLAW v2 GitHub Setup Script"
echo "===================================="
echo ""

# Configuration
PROJECT_NAME="kimi-claw-v2"
PROJECT_DIR="$HOME/Projects/$PROJECT_NAME"
GITHUB_USER="${1:-YOUR_USERNAME}"

echo "📁 Project will be created at: $PROJECT_DIR"
echo "🔗 GitHub user: $GITHUB_USER"
echo ""

# Check dependencies
echo "🔍 Checking dependencies..."

if ! command -v git &> /dev/null; then
    echo "❌ Git not found. Installing..."
    brew install git || { echo "Failed to install git"; exit 1; }
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first"
    echo "   Visit: https://nodejs.org"
    exit 1
fi

echo "✅ Dependencies OK"
echo ""

# Create project directory
echo "📂 Creating project directory..."
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Create directory structure
mkdir -p src/core src/tools test design docs

echo "✅ Directory structure created"
echo ""

# Create package.json
echo "📝 Creating package.json..."
cat > package.json << 'PACKAGEFILE'
{
  "name": "kimi-claw-v2",
  "version": "2.0.0",
  "description": "KIMI CLAW v2 - Complete Agent system with MCP protocol and multi-agent collaboration",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "node --experimental-specifier-resolution=node test/integration.test.ts",
    "dev": "tsc --watch",
    "docs": "typedoc"
  },
  "keywords": [
    "ai",
    "agent",
    "claude",
    "kimi",
    "mcp",
    "multi-agent",
    "llm",
    "autonomous"
  ],
  "author": "明夷 (MoYin Claw)",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "typedoc": "^0.25.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/OWNER/kimi-claw-v2.git"
  },
  "bugs": {
    "url": "https://github.com/OWNER/kimi-claw-v2/issues"
  },
  "homepage": "https://github.com/OWNER/kimi-claw-v2#readme"
}
PACKAGEFILE

# Create tsconfig.json
echo "📝 Creating tsconfig.json..."
cat > tsconfig.json << 'TSCONFIG'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
TSCONFIG

# Create typedoc.json
echo "📝 Creating typedoc.json..."
cat > typedoc.json << 'TYPEDOC'
{
  "entryPoints": ["src/index.ts"],
  "out": "./docs/api",
  "theme": "default",
  "excludePrivate": true,
  "excludeProtected": false,
  "excludeExternals": true,
  "readme": "./README.md",
  "name": "KIMI CLAW v2",
  "includeVersion": true,
  "sort": ["source-order"],
  "categorizeByGroup": true,
  "categoryOrder": ["Core", "Agent", "Tools", "MCP", "Multi-Agent", "*"]
}
TYPEDOC

echo "✅ Configuration files created"
echo ""

# Create main entry file
echo "📝 Creating main entry file..."
cat > src/index.ts << 'INDEXFILE'
/**
 * KIMI CLAW v2 - Main Entry Point
 * Complete Agent System with MCP and Multi-Agent support
 */

import { 
  ToolExecutor, 
  ExecutionContext, 
  globalToolRegistry,
  PermissionConfig,
  ExecutionResult,
  PermissionPrompt,
  PermissionManager,
  globalPermissionManager,
  CLAUDELoader,
  globalCLAUDELoader,
  SessionManager,
  globalSessionManager,
  Session,
  AgentLoop,
  AgentConfig,
  AgentState,
  SmartContextManager,
  MCPServer,
  MCPClient,
  MultiAgentCoordinator,
  AgentDefinition,
  TaskAssignment,
  CollaborationStrategy
} from './core/index.js';
import { registerDefaultTools } from './tools/index.js';

export interface KIMI_CLAW_Config {
  sessionId?: string;
  userId?: string;
  permissions?: PermissionConfig;
  configDir?: string;
  sessionsDir?: string;
  workspaceRoot?: string;
  autoLoadCLAUDE?: boolean;
  agentConfig?: Partial<AgentConfig>;
  enableAgentLoop?: boolean;
  enableMCP?: boolean;
  enableMultiAgent?: boolean;
}

export class KIMI_CLAW {
  private executor: ToolExecutor;
  private context: ExecutionContext;
  private permissionManager: PermissionManager;
  private claudeLoader: CLAUDELoader;
  private sessionManager: SessionManager;
  private agentLoop?: AgentLoop;
  private contextManager: SmartContextManager;
  private mcpServer?: MCPServer;
  private multiAgentCoordinator?: MultiAgentCoordinator;
  private config: KIMI_CLAW_Config;

  constructor(config: KIMI_CLAW_Config = {}) {
    this.config = config;

    this.permissionManager = config.configDir 
      ? new PermissionManager(config.configDir)
      : globalPermissionManager;
    this.permissionManager.initialize();

    this.claudeLoader = config.workspaceRoot 
      ? new CLAUDELoader(config.workspaceRoot)
      : globalCLAUDELoader;

    this.sessionManager = config.sessionsDir 
      ? new SessionManager(config.sessionsDir)
      : globalSessionManager;

    this.contextManager = new SmartContextManager(
      config.agentConfig?.maxTokens || 8000,
      0.8
    );

    if (globalToolRegistry.getAllTools().length === 0) {
      registerDefaultTools();
    }
    
    this.executor = new ToolExecutor(globalToolRegistry);
    
    const pmConfig = this.permissionManager.getConfig();
    this.context = {
      sessionId: config.sessionId || `session-${Date.now()}`,
      userId: config.userId || 'anonymous',
      timestamp: new Date(),
      permissions: config.permissions || pmConfig.rules
    };

    if (config.enableAgentLoop) {
      this.agentLoop = new AgentLoop(
        globalToolRegistry,
        this.sessionManager,
        config.agentConfig
      );
    }

    if (config.enableMCP) {
      this.mcpServer = new MCPServer(
        globalToolRegistry,
        this.permissionManager
      );
    }

    if (config.enableMultiAgent) {
      this.multiAgentCoordinator = new MultiAgentCoordinator(
        globalToolRegistry,
        this.sessionManager
      );
    }

    if (config.sessionId) {
      this.sessionManager.continueSession(config.sessionId);
    } else {
      this.sessionManager.createSession({
        title: `Session ${new Date().toISOString()}`
      });
      this.context.sessionId = this.sessionManager.getCurrentSessionId()!;
    }
  }

  async execute(toolName: string, input: unknown, userConfirm?: boolean): Promise<ExecutionResult | PermissionPrompt> {
    this.context.permissions = this.permissionManager.getConfig().rules;
    
    this.sessionManager.appendMessage({
      role: 'user',
      content: `Execute ${toolName}`,
      metadata: { toolName, toolInput: input }
    });

    const result = await this.executor.execute(toolName, input, this.context, userConfirm);

    if ('output' in result) {
      this.sessionManager.appendMessage({
        role: 'tool',
        content: result.output.success ? 'Success' : `Error: ${result.output.error}`,
        metadata: { toolName, toolInput: input, toolOutput: result.output }
      });
    }

    return result;
  }

  async runAgent(query: string): Promise<AgentState> {
    if (!this.agentLoop) {
      this.agentLoop = new AgentLoop(
        globalToolRegistry,
        this.sessionManager,
        this.config.agentConfig
      );
    }

    this.context.permissions = this.permissionManager.getConfig().rules;
    return this.agentLoop.run(query, this.context);
  }

  registerAgent(agent: AgentDefinition): void {
    this.multiAgentCoordinator?.registerAgent(agent);
  }

  assignTask(task: Omit<TaskAssignment, 'taskId'>): TaskAssignment {
    if (!this.multiAgentCoordinator) {
      throw new Error('Multi-Agent not enabled');
    }
    return this.multiAgentCoordinator.assignTask(task);
  }

  async executeTasks(taskIds: string[], strategy?: CollaborationStrategy) {
    if (!this.multiAgentCoordinator) {
      throw new Error('Multi-Agent not enabled');
    }
    return this.multiAgentCoordinator.executeTasks(taskIds, strategy);
  }

  async handleMCPRequest(request: import('./core/MCPServer.js').MCPRequest) {
    if (!this.mcpServer) {
      throw new Error('MCP not enabled');
    }
    return this.mcpServer.handleRequest(request);
  }

  isAgentRunning(): boolean {
    return this.agentLoop?.isRunning() || false;
  }

  stopAgent(): void {
    this.agentLoop?.stop();
  }

  getAgentState(): AgentState | undefined {
    return this.agentLoop?.getState();
  }

  setAgentHandlers(handlers: {
    onStep?: (step: import('./core/AgentLoop.js').AgentStep) => void;
    onComplete?: (state: AgentState) => void;
    onError?: (error: Error) => void;
  }): void {
    this.agentLoop?.setHandlers(handlers);
  }

  manageContext(steps: import('./core/AgentLoop.js').AgentStep[]) {
    return this.contextManager.manage(steps);
  }

  loadCLAUDEContext(filePath: string): string {
    if (!this.config.autoLoadCLAUDE) {
      return '';
    }
    return this.claudeLoader.getSystemPrompt(filePath);
  }

  listTools(): Array<{name: string; description: string; category: string; permission: string}> {
    return globalToolRegistry.getToolDescriptions();
  }

  getHistory(): ExecutionResult[] {
    return this.executor.getHistory();
  }

  getSessionId(): string {
    return this.context.sessionId;
  }

  getCurrentSession(): Session | null {
    const sessionId = this.sessionManager.getCurrentSessionId();
    return sessionId ? this.sessionManager.loadSession(sessionId) : null;
  }

  getPermissionManager(): PermissionManager {
    return this.permissionManager;
  }

  getSessionManager(): SessionManager {
    return this.sessionManager;
  }

  getCLAUDELoader(): CLAUDELoader {
    return this.claudeLoader;
  }

  getMultiAgentCoordinator(): MultiAgentCoordinator | undefined {
    return this.multiAgentCoordinator;
  }

  getMCPServer(): MCPServer | undefined {
    return this.mcpServer;
  }

  isToolAllowed(toolName: string): boolean {
    return this.permissionManager.isAllowed(toolName);
  }

  allowTool(toolName: string): void {
    this.permissionManager.allowTool(toolName);
  }

  denyTool(toolName: string): void {
    this.permissionManager.denyTool(toolName);
  }

  askTool(toolName: string): void {
    this.permissionManager.askTool(toolName);
  }

  forkSession(messageIndex?: number): Session | null {
    const currentSession = this.sessionManager.getCurrentSessionId();
    if (!currentSession) return null;
    
    const session = this.sessionManager.loadSession(currentSession);
    if (!session) return null;

    const forkPoint = messageIndex ?? session.messages.length - 1;
    const newSession = this.sessionManager.forkSession(currentSession, forkPoint, {
      title: `Fork of ${session.metadata.title}`
    });

    if (newSession) {
      this.context.sessionId = newSession.metadata.id;
    }

    return newSession;
  }

  continueSession(sessionId: string): Session | null {
    const session = this.sessionManager.continueSession(sessionId);
    if (session) {
      this.context.sessionId = sessionId;
    }
    return session;
  }

  listSessions(options?: { includeArchived?: boolean; limit?: number }) {
    return this.sessionManager.listSessions(options);
  }

  getStats() {
    return this.sessionManager.getStats();
  }
}

export * from './core/index.js';
export * from './tools/index.js';
export default KIMI_CLAW;
INDEXFILE

echo "⚠️  Note: Core module files need to be copied separately"
echo "   (AgentLoop.ts, ContextCompressor.ts, MCPServer.ts, etc.)"
echo ""

# Initialize git
echo "🔧 Initializing Git repository..."
git init
git config user.name "Developer"
git config user.email "dev@example.com"

echo "✅ Git repository initialized"
echo ""

# Create .gitignore
cat > .gitignore << 'GITIGNORE'
# Dependencies
node_modules/
package-lock.json
yarn.lock
pnpm-lock.yaml

# Build output
dist/
build/
*.js.map
*.d.ts.map

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Testing
coverage/
.nyc_output/

# Misc
.cache/
temp/
tmp/
GITIGNORE

echo "===================================="
echo "📦 Project structure created!"
echo ""
echo "Next steps:"
echo "  1. Copy remaining source files from the conversation"
echo "     - src/core/*.ts"
echo "     - src/tools/*.ts"
echo "     - test/*.ts"
echo ""
echo "  2. Install dependencies:"
echo "     npm install"
echo ""
echo "  3. Build:"
echo "     npm run build"
echo ""
echo "  4. Commit and push:"
echo "     git add ."
echo "     git commit -m 'Initial commit'"
echo "     git remote add origin https://github.com/$GITHUB_USER/kimi-claw-v2.git"
echo "     git push -u origin main"
echo ""
echo "===================================="
