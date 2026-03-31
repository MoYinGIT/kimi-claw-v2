/**
 * KIMI CLAW v2 - Main Entry Point
 * Complete Agent System with MCP and Multi-Agent support
 */
import { PermissionConfig, ExecutionResult, PermissionPrompt, PermissionManager, CLAUDELoader, SessionManager, Session, AgentConfig, AgentState, MCPServer, MultiAgentCoordinator, AgentDefinition, TaskAssignment, CollaborationStrategy } from './core/index.js';
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
export declare class KIMI_CLAW {
    private executor;
    private context;
    private permissionManager;
    private claudeLoader;
    private sessionManager;
    private agentLoop?;
    private contextManager;
    private mcpServer?;
    private multiAgentCoordinator?;
    private config;
    constructor(config?: KIMI_CLAW_Config);
    /**
     * Execute a tool (single-turn mode)
     */
    execute(toolName: string, input: unknown, userConfirm?: boolean): Promise<ExecutionResult | PermissionPrompt>;
    /**
     * Run Agent Loop (multi-turn reasoning)
     */
    runAgent(query: string): Promise<AgentState>;
    /**
     * Register an Agent for multi-agent collaboration
     */
    registerAgent(agent: AgentDefinition): void;
    /**
     * Assign task to an Agent
     */
    assignTask(task: Omit<TaskAssignment, 'taskId'>): TaskAssignment;
    /**
     * Execute tasks with collaboration strategy
     */
    executeTasks(taskIds: string[], strategy?: CollaborationStrategy): Promise<import("./core/MultiAgentCoordinator.js").TaskResult[]>;
    /**
     * Handle MCP request
     */
    handleMCPRequest(request: import('./core/MCPServer.js').MCPRequest): Promise<import("./core/MCPServer.js").MCPResponse>;
    /**
     * Check if Agent Loop is running
     */
    isAgentRunning(): boolean;
    /**
     * Stop Agent Loop
     */
    stopAgent(): void;
    /**
     * Get current Agent state
     */
    getAgentState(): AgentState | undefined;
    /**
     * Set Agent event handlers
     */
    setAgentHandlers(handlers: {
        onStep?: (step: import('./core/AgentLoop.js').AgentStep) => void;
        onComplete?: (state: AgentState) => void;
        onError?: (error: Error) => void;
    }): void;
    /**
     * Manage context compression
     */
    manageContext(steps: import('./core/AgentLoop.js').AgentStep[]): import("./core/ContextCompressor.js").CompressedContext;
    /**
     * Load CLAUDE.md context for a file
     */
    loadCLAUDEContext(filePath: string): string;
    /**
     * List all available tools
     */
    listTools(): Array<{
        name: string;
        description: string;
        category: string;
        permission: string;
    }>;
    /**
     * Get execution history
     */
    getHistory(): ExecutionResult[];
    /**
     * Get current session ID
     */
    getSessionId(): string;
    /**
     * Get current session
     */
    getCurrentSession(): Session | null;
    /**
     * Get permission manager
     */
    getPermissionManager(): PermissionManager;
    /**
     * Get session manager
     */
    getSessionManager(): SessionManager;
    /**
     * Get CLAUDE loader
     */
    getCLAUDELoader(): CLAUDELoader;
    /**
     * Get multi-agent coordinator
     */
    getMultiAgentCoordinator(): MultiAgentCoordinator | undefined;
    /**
     * Get MCP server
     */
    getMCPServer(): MCPServer | undefined;
    /**
     * Check if a tool is allowed
     */
    isToolAllowed(toolName: string): boolean;
    /**
     * Allow a tool
     */
    allowTool(toolName: string): void;
    /**
     * Deny a tool
     */
    denyTool(toolName: string): void;
    /**
     * Require ask for a tool
     */
    askTool(toolName: string): void;
    /**
     * Fork current session at current message
     */
    forkSession(messageIndex?: number): Session | null;
    /**
     * Continue a previous session
     */
    continueSession(sessionId: string): Session | null;
    /**
     * List all sessions
     */
    listSessions(options?: {
        includeArchived?: boolean;
        limit?: number;
    }): import("./core/SessionManager.js").SessionIndexEntry[];
    /**
     * Get session statistics
     */
    getStats(): {
        totalSessions: number;
        totalMessages: number;
        archivedSessions: number;
        activeSessions: number;
    };
}
export * from './core/index.js';
export * from './tools/index.js';
export default KIMI_CLAW;
//# sourceMappingURL=index.d.ts.map