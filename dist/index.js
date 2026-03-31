/**
 * KIMI CLAW v2 - Main Entry Point
 * Complete Agent System with MCP and Multi-Agent support
 */
import { ToolExecutor, globalToolRegistry, PermissionManager, globalPermissionManager, CLAUDELoader, globalCLAUDELoader, SessionManager, globalSessionManager, AgentLoop, SmartContextManager, MCPServer, MultiAgentCoordinator } from './core/index.js';
import { registerDefaultTools } from './tools/index.js';
export class KIMI_CLAW {
    executor;
    context;
    permissionManager;
    claudeLoader;
    sessionManager;
    agentLoop;
    contextManager;
    mcpServer;
    multiAgentCoordinator;
    config;
    constructor(config = {}) {
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
        this.contextManager = new SmartContextManager(config.agentConfig?.maxTokens || 8000, 0.8);
        // Register default tools
        if (globalToolRegistry.getAllTools().length === 0) {
            registerDefaultTools();
        }
        // Initialize executor
        this.executor = new ToolExecutor(globalToolRegistry);
        // Setup execution context
        const pmConfig = this.permissionManager.getConfig();
        const userPerms = config.permissions;
        // Support both direct permission format and nested rules format
        let permissions;
        if (userPerms && 'rules' in userPerms) {
            permissions = userPerms;
        }
        else if (userPerms) {
            // Convert flat format to nested format
            permissions = {
                ...pmConfig,
                rules: {
                    alwaysAllow: userPerms.alwaysAllow || [],
                    alwaysDeny: userPerms.alwaysDeny || [],
                    alwaysAsk: userPerms.alwaysAsk || []
                }
            };
        }
        else {
            permissions = pmConfig;
        }
        this.context = {
            sessionId: config.sessionId || `session-${Date.now()}`,
            userId: config.userId || 'anonymous',
            timestamp: new Date(),
            permissions
        };
        // Initialize Agent Loop if enabled
        if (config.enableAgentLoop) {
            this.agentLoop = new AgentLoop(globalToolRegistry, this.sessionManager, config.agentConfig);
        }
        // Initialize MCP Server if enabled
        if (config.enableMCP) {
            this.mcpServer = new MCPServer(globalToolRegistry, this.permissionManager);
        }
        // Initialize Multi-Agent Coordinator if enabled
        if (config.enableMultiAgent) {
            this.multiAgentCoordinator = new MultiAgentCoordinator(globalToolRegistry, this.sessionManager);
        }
        // Resume or create session
        if (config.sessionId) {
            this.sessionManager.continueSession(config.sessionId);
        }
        else {
            this.sessionManager.createSession({
                title: `Session ${new Date().toISOString()}`
            });
            this.context.sessionId = this.sessionManager.getCurrentSessionId();
        }
    }
    /**
     * Execute a tool (single-turn mode)
     */
    async execute(toolName, input, userConfirm) {
        // Update context with current permission rules
        this.context.permissions = this.permissionManager.getConfig();
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
    async runAgent(query) {
        if (!this.agentLoop) {
            this.agentLoop = new AgentLoop(globalToolRegistry, this.sessionManager, this.config.agentConfig);
        }
        this.context.permissions = this.permissionManager.getConfig();
        return this.agentLoop.run(query, this.context);
    }
    /**
     * Register an Agent for multi-agent collaboration
     */
    registerAgent(agent) {
        this.multiAgentCoordinator?.registerAgent(agent);
    }
    /**
     * Assign task to an Agent
     */
    assignTask(task) {
        if (!this.multiAgentCoordinator) {
            throw new Error('Multi-Agent not enabled');
        }
        return this.multiAgentCoordinator.assignTask(task);
    }
    /**
     * Execute tasks with collaboration strategy
     */
    async executeTasks(taskIds, strategy) {
        if (!this.multiAgentCoordinator) {
            throw new Error('Multi-Agent not enabled');
        }
        return this.multiAgentCoordinator.executeTasks(taskIds, strategy);
    }
    /**
     * Handle MCP request
     */
    async handleMCPRequest(request) {
        if (!this.mcpServer) {
            throw new Error('MCP not enabled');
        }
        return this.mcpServer.handleRequest(request);
    }
    // ... rest of the methods remain the same ...
    /**
     * Check if Agent Loop is running
     */
    isAgentRunning() {
        return this.agentLoop?.isRunning() || false;
    }
    /**
     * Stop Agent Loop
     */
    stopAgent() {
        this.agentLoop?.stop();
    }
    /**
     * Get current Agent state
     */
    getAgentState() {
        return this.agentLoop?.getState();
    }
    /**
     * Set Agent event handlers
     */
    setAgentHandlers(handlers) {
        this.agentLoop?.setHandlers(handlers);
    }
    /**
     * Manage context compression
     */
    manageContext(steps) {
        return this.contextManager.manage(steps);
    }
    /**
     * Load CLAUDE.md context for a file
     */
    loadCLAUDEContext(filePath) {
        if (!this.config.autoLoadCLAUDE) {
            return '';
        }
        return this.claudeLoader.getSystemPrompt(filePath);
    }
    /**
     * List all available tools
     */
    listTools() {
        return globalToolRegistry.getToolDescriptions();
    }
    /**
     * Get execution history
     */
    getHistory() {
        return this.executor.getHistory();
    }
    /**
     * Get current session ID
     */
    getSessionId() {
        return this.context.sessionId;
    }
    /**
     * Get current session
     */
    getCurrentSession() {
        const sessionId = this.sessionManager.getCurrentSessionId();
        return sessionId ? this.sessionManager.loadSession(sessionId) : null;
    }
    /**
     * Get permission manager
     */
    getPermissionManager() {
        return this.permissionManager;
    }
    /**
     * Get session manager
     */
    getSessionManager() {
        return this.sessionManager;
    }
    /**
     * Get CLAUDE loader
     */
    getCLAUDELoader() {
        return this.claudeLoader;
    }
    /**
     * Get multi-agent coordinator
     */
    getMultiAgentCoordinator() {
        return this.multiAgentCoordinator;
    }
    /**
     * Get MCP server
     */
    getMCPServer() {
        return this.mcpServer;
    }
    /**
     * Check if a tool is allowed
     */
    isToolAllowed(toolName) {
        return this.permissionManager.isAllowed(toolName);
    }
    /**
     * Allow a tool
     */
    allowTool(toolName) {
        this.permissionManager.allowTool(toolName);
    }
    /**
     * Deny a tool
     */
    denyTool(toolName) {
        this.permissionManager.denyTool(toolName);
    }
    /**
     * Require ask for a tool
     */
    askTool(toolName) {
        this.permissionManager.askTool(toolName);
    }
    /**
     * Fork current session at current message
     */
    forkSession(messageIndex) {
        const currentSession = this.sessionManager.getCurrentSessionId();
        if (!currentSession)
            return null;
        const session = this.sessionManager.loadSession(currentSession);
        if (!session)
            return null;
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
    continueSession(sessionId) {
        const session = this.sessionManager.continueSession(sessionId);
        if (session) {
            this.context.sessionId = sessionId;
        }
        return session;
    }
    /**
     * List all sessions
     */
    listSessions(options) {
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
//# sourceMappingURL=index.js.map