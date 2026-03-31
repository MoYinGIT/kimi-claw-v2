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

    // Initialize permission manager
    this.permissionManager = config.configDir 
      ? new PermissionManager(config.configDir)
      : globalPermissionManager;
    this.permissionManager.initialize();

    // Initialize CLAUDE loader
    this.claudeLoader = config.workspaceRoot 
      ? new CLAUDELoader(config.workspaceRoot)
      : globalCLAUDELoader;

    // Initialize session manager
    this.sessionManager = config.sessionsDir 
      ? new SessionManager(config.sessionsDir)
      : globalSessionManager;

    // Initialize context manager
    this.contextManager = new SmartContextManager(
      config.agentConfig?.maxTokens || 8000,
      0.8
    );

    // Register default tools
    if (globalToolRegistry.getAllTools().length === 0) {
      registerDefaultTools();
    }
    
    // Initialize executor
    this.executor = new ToolExecutor(globalToolRegistry);
    
    // Setup execution context
    const pmConfig = this.permissionManager.getConfig();
    this.context = {
      sessionId: config.sessionId || `session-${Date.now()}`,
      userId: config.userId || 'anonymous',
      timestamp: new Date(),
      permissions: config.permissions || pmConfig.rules
    };

    // Initialize Agent Loop if enabled
    if (config.enableAgentLoop) {
      this.agentLoop = new AgentLoop(
        globalToolRegistry,
        this.sessionManager,
        config.agentConfig
      );
    }

    // Initialize MCP Server if enabled
    if (config.enableMCP) {
      this.mcpServer = new MCPServer(
        globalToolRegistry,
        this.permissionManager
      );
    }

    // Initialize Multi-Agent Coordinator if enabled
    if (config.enableMultiAgent) {
      this.multiAgentCoordinator = new MultiAgentCoordinator(
        globalToolRegistry,
        this.sessionManager
      );
    }

    // Resume or create session
    if (config.sessionId) {
      this.sessionManager.continueSession(config.sessionId);
    } else {
      this.sessionManager.createSession({
        title: `Session ${new Date().toISOString()}`
      });
      this.context.sessionId = this.sessionManager.getCurrentSessionId()!;
    }
  }

  /**
   * Execute a tool (single-turn mode)
   */
  async execute(
    toolName: string, 
    input: unknown,
    userConfirm?: boolean
  ): Promise<ExecutionResult | PermissionPrompt> {
    // Update context with current permission rules
    this.context.permissions = this.permissionManager.getConfig().rules;
    
    // Log user message
    this.sessionManager.appendMessage({
      role: 'user',
      content: `Execute ${toolName}`,
      metadata: { toolName, toolInput: input }
    });

    const result = await this.executor.execute(toolName, input, this.context, userConfirm);

    // Log assistant/tool response
    if ('output' in result) {
      this.sessionManager.appendMessage({
        role: 'tool',
        content: result.output.success ? 'Success' : `Error: ${result.output.error}`,
        metadata: { 
          toolName, 
          toolInput: input,
          toolOutput: result.output 
        }
      });
    }

    return result;
  }

  /**
   * Run Agent Loop (multi-turn reasoning)
   */
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

  /**
   * Register an Agent for multi-agent collaboration
   */
  registerAgent(agent: AgentDefinition): void {
    this.multiAgentCoordinator?.registerAgent(agent);
  }

  /**
   * Assign task to an Agent
   */
  assignTask(task: Omit<TaskAssignment, 'taskId'>): TaskAssignment {
    if (!this.multiAgentCoordinator) {
      throw new Error('Multi-Agent not enabled');
    }
    return this.multiAgentCoordinator.assignTask(task);
  }

  /**
   * Execute tasks with collaboration strategy
   */
  async executeTasks(taskIds: string[], strategy?: CollaborationStrategy) {
    if (!this.multiAgentCoordinator) {
      throw new Error('Multi-Agent not enabled');
    }
    return this.multiAgentCoordinator.executeTasks(taskIds, strategy);
  }

  /**
   * Handle MCP request
   */
  async handleMCPRequest(request: import('./core/MCPServer.js').MCPRequest) {
    if (!this.mcpServer) {
      throw new Error('MCP not enabled');
    }
    return this.mcpServer.handleRequest(request);
  }

  // ... rest of the methods remain the same ...

  /**
   * Check if Agent Loop is running
   */
  isAgentRunning(): boolean {
    return this.agentLoop?.isRunning() || false;
  }

  /**
   * Stop Agent Loop
   */
  stopAgent(): void {
    this.agentLoop?.stop();
  }

  /**
   * Get current Agent state
   */
  getAgentState(): AgentState | undefined {
    return this.agentLoop?.getState();
  }

  /**
   * Set Agent event handlers
   */
  setAgentHandlers(handlers: {
    onStep?: (step: import('./core/AgentLoop.js').AgentStep) => void;
    onComplete?: (state: AgentState) => void;
    onError?: (error: Error) => void;
  }): void {
    this.agentLoop?.setHandlers(handlers);
  }

  /**
   * Manage context compression
   */
  manageContext(steps: import('./core/AgentLoop.js').AgentStep[]) {
    return this.contextManager.manage(steps);
  }

  /**
   * Load CLAUDE.md context for a file
   */
  loadCLAUDEContext(filePath: string): string {
    if (!this.config.autoLoadCLAUDE) {
      return '';
    }
    return this.claudeLoader.getSystemPrompt(filePath);
  }

  /**
   * List all available tools
   */
  listTools(): Array<{
    name: string;
    description: string;
    category: string;
    permission: string;
  }> {
    return globalToolRegistry.getToolDescriptions();
  }

  /**
   * Get execution history
   */
  getHistory(): ExecutionResult[] {
    return this.executor.getHistory();
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.context.sessionId;
  }

  /**
   * Get current session
   */
  getCurrentSession(): Session | null {
    const sessionId = this.sessionManager.getCurrentSessionId();
    return sessionId ? this.sessionManager.loadSession(sessionId) : null;
  }

  /**
   * Get permission manager
   */
  getPermissionManager(): PermissionManager {
    return this.permissionManager;
  }

  /**
   * Get session manager
   */
  getSessionManager(): SessionManager {
    return this.sessionManager;
  }

  /**
   * Get CLAUDE loader
   */
  getCLAUDELoader(): CLAUDELoader {
    return this.claudeLoader;
  }

  /**
   * Get multi-agent coordinator
   */
  getMultiAgentCoordinator(): MultiAgentCoordinator | undefined {
    return this.multiAgentCoordinator;
  }

  /**
   * Get MCP server
   */
  getMCPServer(): MCPServer | undefined {
    return this.mcpServer;
  }

  /**
   * Check if a tool is allowed
   */
  isToolAllowed(toolName: string): boolean {
    return this.permissionManager.isAllowed(toolName);
  }

  /**
   * Allow a tool
   */
  allowTool(toolName: string): void {
    this.permissionManager.allowTool(toolName);
  }

  /**
   * Deny a tool
   */
  denyTool(toolName: string): void {
    this.permissionManager.denyTool(toolName);
  }

  /**
   * Require ask for a tool
   */
  askTool(toolName: string): void {
    this.permissionManager.askTool(toolName);
  }

  /**
   * Fork current session at current message
   */
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

  /**
   * Continue a previous session
   */
  continueSession(sessionId: string): Session | null {
    const session = this.sessionManager.continueSession(sessionId);
    if (session) {
      this.context.sessionId = sessionId;
    }
    return session;
  }

  /**
   * List all sessions
   */
  listSessions(options?: { includeArchived?: boolean; limit?: number }) {
    return this.sessionManager.listSessions(options);
  }

  /**
   * Get session statistics
   */
  getStats() {
    return this.sessionManager.getStats();
  }
}

// Re-export types
export * from './core/index.js';
export * from './tools/index.js';

// Default export
export default KIMI_CLAW;
