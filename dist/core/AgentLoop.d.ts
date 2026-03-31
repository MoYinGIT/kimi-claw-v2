/**
 * Agent Loop - Core multi-turn reasoning engine
 * Transforms single-response system into true Agent
 */
import { ExecutionContext } from './ToolExecutor.js';
import { ToolRegistry } from './ToolRegistry.js';
import { SessionManager } from './SessionManager.js';
/**
 * Agent reasoning step
 */
export interface AgentStep {
    stepNumber: number;
    timestamp: string;
    type: 'thought' | 'tool_call' | 'tool_result' | 'final_answer' | 'error';
    content: string;
    metadata?: {
        toolName?: string;
        toolInput?: unknown;
        toolOutput?: unknown;
        duration?: number;
    };
}
/**
 * Agent execution state
 */
export interface AgentState {
    query: string;
    steps: AgentStep[];
    isRunning: boolean;
    isComplete: boolean;
    error?: string;
    contextWindow: {
        currentTokens: number;
        maxTokens: number;
    };
}
/**
 * Agent configuration
 */
export interface AgentConfig {
    maxSteps: number;
    maxTokens: number;
    autoApproveTools: string[];
    requireConfirmation: boolean;
    stopOnError: boolean;
    enableStreaming: boolean;
}
/**
 * Default agent configuration
 */
export declare const DEFAULT_AGENT_CONFIG: AgentConfig;
/**
 * Agent Loop - Multi-turn reasoning engine
 */
export declare class AgentLoop {
    private executor;
    private sessionManager;
    private config;
    private state;
    private onStep?;
    private onComplete?;
    private onError?;
    constructor(toolRegistry: ToolRegistry, sessionManager: SessionManager, config?: Partial<AgentConfig>);
    /**
     * Set event handlers
     */
    setHandlers(handlers: {
        onStep?: (step: AgentStep) => void;
        onComplete?: (state: AgentState) => void;
        onError?: (error: Error) => void;
    }): void;
    /**
     * Execute agent loop for a user query
     */
    run(query: string, context: ExecutionContext): Promise<AgentState>;
    /**
     * Determine next action based on current state
     * In real implementation, this would call LLM API
     */
    private determineNextAction;
    /**
     * Execute a tool
     */
    private executeTool;
    /**
     * Add a step to the agent state
     */
    private addStep;
    /**
     * Estimate token count (rough approximation)
     */
    private estimateTokens;
    /**
     * Get current state
     */
    getState(): AgentState;
    /**
     * Check if agent is running
     */
    isRunning(): boolean;
    /**
     * Stop the agent loop
     */
    stop(): void;
    /**
     * Reset agent state
     */
    reset(): void;
}
export declare function createAgentLoop(toolRegistry: ToolRegistry, sessionManager: SessionManager, config?: Partial<AgentConfig>): AgentLoop;
//# sourceMappingURL=AgentLoop.d.ts.map