/**
 * Multi-Agent Coordinator
 * Enables collaboration between multiple Agents
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from 'events';
import { AgentConfig } from './AgentLoop.js';
import { SessionManager } from './SessionManager.js';
import { ToolRegistry } from './ToolRegistry.js';
/**
 * Agent definition
 */
export interface AgentDefinition {
    id: string;
    name: string;
    role: string;
    description: string;
    capabilities: string[];
    config?: Partial<AgentConfig>;
}
/**
 * Task assignment
 */
export interface TaskAssignment {
    taskId: string;
    agentId: string;
    task: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    deadline?: Date;
    dependencies?: string[];
}
/**
 * Task result
 */
export interface TaskResult {
    taskId: string;
    agentId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: string;
    error?: string;
    startTime?: Date;
    endTime?: Date;
    steps?: number;
}
/**
 * Agent message
 */
export interface AgentMessage {
    from: string;
    to: string;
    type: 'request' | 'response' | 'broadcast' | 'status';
    content: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
}
/**
 * Collaboration strategy
 */
export type CollaborationStrategy = 'sequential' | 'parallel' | 'pipeline' | 'hierarchical';
/**
 * Coordinator configuration
 */
export interface CoordinatorConfig {
    maxAgents: number;
    maxConcurrentTasks: number;
    defaultStrategy: CollaborationStrategy;
    enableMessageBus: boolean;
    taskTimeout: number;
}
/**
 * Default coordinator config
 */
export declare const DEFAULT_COORDINATOR_CONFIG: CoordinatorConfig;
/**
 * Multi-Agent Coordinator
 */
export declare class MultiAgentCoordinator extends EventEmitter {
    private toolRegistry;
    private sessionManager;
    private config;
    private agents;
    private agentInstances;
    private tasks;
    private results;
    private messages;
    private runningTasks;
    constructor(toolRegistry: ToolRegistry, sessionManager: SessionManager, config?: Partial<CoordinatorConfig>);
    /**
     * Register a new Agent
     */
    registerAgent(definition: AgentDefinition): void;
    /**
     * Unregister an Agent
     */
    unregisterAgent(agentId: string): void;
    /**
     * Get registered Agents
     */
    getAgents(): AgentDefinition[];
    /**
     * Get Agent by ID
     */
    getAgent(agentId: string): AgentDefinition | undefined;
    /**
     * Assign task to an Agent
     */
    assignTask(assignment: Omit<TaskAssignment, 'taskId'>): TaskAssignment;
    /**
     * Execute a single task
     */
    executeTask(taskId: string): Promise<TaskResult>;
    /**
     * Execute multiple tasks with strategy
     */
    executeTasks(taskIds: string[], strategy?: CollaborationStrategy): Promise<TaskResult[]>;
    /**
     * Execute tasks sequentially
     */
    private executeSequential;
    /**
     * Execute tasks in parallel
     */
    private executeParallel;
    /**
     * Execute tasks in pipeline (output of A → input of B)
     */
    private executePipeline;
    /**
     * Execute tasks hierarchically (manager delegates)
     */
    private executeHierarchical;
    /**
     * Send message between Agents
     */
    sendMessage(message: Omit<AgentMessage, 'timestamp'>): void;
    /**
     * Broadcast message to all Agents
     */
    broadcast(from: string, content: string, metadata?: Record<string, unknown>): void;
    /**
     * Get message history
     */
    getMessages(filter?: {
        from?: string;
        to?: string;
    }): AgentMessage[];
    /**
     * Get task result
     */
    getResult(taskId: string): TaskResult | undefined;
    /**
     * Get all results
     */
    getAllResults(): TaskResult[];
    /**
     * Get running tasks
     */
    getRunningTasks(): string[];
    /**
     * Wait for all tasks to complete
     */
    waitForAll(): Promise<TaskResult[]>;
    /**
     * Summarize Agent result
     */
    private summarizeResult;
    /**
     * Clear all data
     */
    clear(): void;
}
export declare function createMultiAgentCoordinator(toolRegistry: ToolRegistry, sessionManager: SessionManager, config?: Partial<CoordinatorConfig>): MultiAgentCoordinator;
//# sourceMappingURL=MultiAgentCoordinator.d.ts.map