/**
 * Multi-Agent Coordinator
 * Enables collaboration between multiple Agents
 */
import { EventEmitter } from 'events';
import { AgentLoop } from './AgentLoop.js';
/**
 * Default coordinator config
 */
export const DEFAULT_COORDINATOR_CONFIG = {
    maxAgents: 10,
    maxConcurrentTasks: 5,
    defaultStrategy: 'parallel',
    enableMessageBus: true,
    taskTimeout: 300000 // 5 minutes
};
/**
 * Multi-Agent Coordinator
 */
export class MultiAgentCoordinator extends EventEmitter {
    toolRegistry;
    sessionManager;
    config;
    agents = new Map();
    agentInstances = new Map();
    tasks = new Map();
    results = new Map();
    messages = [];
    runningTasks = new Set();
    constructor(toolRegistry, sessionManager, config = {}) {
        super();
        this.toolRegistry = toolRegistry;
        this.sessionManager = sessionManager;
        this.config = { ...DEFAULT_COORDINATOR_CONFIG, ...config };
    }
    /**
     * Register a new Agent
     */
    registerAgent(definition) {
        if (this.agents.size >= this.config.maxAgents) {
            throw new Error(`Maximum number of agents (${this.config.maxAgents}) reached`);
        }
        this.agents.set(definition.id, definition);
        // Create Agent instance
        const agent = new AgentLoop(this.toolRegistry, this.sessionManager, definition.config);
        this.agentInstances.set(definition.id, agent);
        this.emit('agent:registered', definition);
    }
    /**
     * Unregister an Agent
     */
    unregisterAgent(agentId) {
        this.agents.delete(agentId);
        this.agentInstances.delete(agentId);
        this.emit('agent:unregistered', agentId);
    }
    /**
     * Get registered Agents
     */
    getAgents() {
        return Array.from(this.agents.values());
    }
    /**
     * Get Agent by ID
     */
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    /**
     * Assign task to an Agent
     */
    assignTask(assignment) {
        const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const fullAssignment = {
            ...assignment,
            taskId
        };
        this.tasks.set(taskId, fullAssignment);
        this.results.set(taskId, {
            taskId,
            agentId: assignment.agentId,
            status: 'pending'
        });
        this.emit('task:assigned', fullAssignment);
        return fullAssignment;
    }
    /**
     * Execute a single task
     */
    async executeTask(taskId) {
        const assignment = this.tasks.get(taskId);
        if (!assignment) {
            throw new Error(`Task ${taskId} not found`);
        }
        const agent = this.agentInstances.get(assignment.agentId);
        if (!agent) {
            throw new Error(`Agent ${assignment.agentId} not found`);
        }
        // Check concurrent task limit
        if (this.runningTasks.size >= this.config.maxConcurrentTasks) {
            throw new Error('Maximum concurrent tasks reached');
        }
        // Update status
        this.runningTasks.add(taskId);
        this.results.set(taskId, {
            ...this.results.get(taskId),
            status: 'running',
            startTime: new Date()
        });
        this.emit('task:started', assignment);
        try {
            // Set up event handlers
            agent.setHandlers({
                onStep: (step) => {
                    this.emit('task:step', { taskId, step });
                },
                onComplete: (state) => {
                    this.results.set(taskId, {
                        ...this.results.get(taskId),
                        status: 'completed',
                        result: this.summarizeResult(state),
                        endTime: new Date(),
                        steps: state.steps.length
                    });
                },
                onError: (error) => {
                    this.results.set(taskId, {
                        ...this.results.get(taskId),
                        status: 'failed',
                        error: error.message,
                        endTime: new Date()
                    });
                }
            });
            // Create execution context
            const context = {
                sessionId: `multi-agent-${taskId}`,
                userId: assignment.agentId,
                timestamp: new Date(),
                permissions: {
                    version: '1.0.0',
                    rules: { alwaysAllow: [], alwaysDeny: [], alwaysAsk: [] },
                    toolOverrides: {},
                    settings: {
                        defaultPermissionLevel: 'ask',
                        logAllExecutions: true,
                        maxExecutionHistory: 1000,
                        showPermissionPrompts: true
                    }
                }
            };
            // Run Agent
            const state = await agent.run(assignment.task, context);
            // Handle completion
            if (state.error) {
                throw new Error(state.error);
            }
            const result = this.results.get(taskId);
            this.emit('task:completed', result);
            return result;
        }
        catch (error) {
            const failedResult = {
                taskId,
                agentId: assignment.agentId,
                status: 'failed',
                error: error instanceof Error ? error.message : String(error),
                endTime: new Date()
            };
            this.results.set(taskId, failedResult);
            this.emit('task:failed', failedResult);
            return failedResult;
        }
        finally {
            this.runningTasks.delete(taskId);
        }
    }
    /**
     * Execute multiple tasks with strategy
     */
    async executeTasks(taskIds, strategy) {
        const useStrategy = strategy || this.config.defaultStrategy;
        switch (useStrategy) {
            case 'sequential':
                return this.executeSequential(taskIds);
            case 'parallel':
                return this.executeParallel(taskIds);
            case 'pipeline':
                return this.executePipeline(taskIds);
            case 'hierarchical':
                return this.executeHierarchical(taskIds);
            default:
                return this.executeParallel(taskIds);
        }
    }
    /**
     * Execute tasks sequentially
     */
    async executeSequential(taskIds) {
        const results = [];
        for (const taskId of taskIds) {
            const result = await this.executeTask(taskId);
            results.push(result);
            // Stop on failure if configured
            if (result.status === 'failed') {
                break;
            }
        }
        return results;
    }
    /**
     * Execute tasks in parallel
     */
    async executeParallel(taskIds) {
        return Promise.all(taskIds.map(id => this.executeTask(id)));
    }
    /**
     * Execute tasks in pipeline (output of A → input of B)
     */
    async executePipeline(taskIds) {
        const results = [];
        let previousOutput = '';
        for (const taskId of taskIds) {
            const assignment = this.tasks.get(taskId);
            if (!assignment)
                continue;
            // Modify task with previous output
            const modifiedTask = previousOutput
                ? `${assignment.task}\n\nPrevious result: ${previousOutput}`
                : assignment.task;
            // Create new assignment with modified task
            this.tasks.set(taskId, { ...assignment, task: modifiedTask });
            const result = await this.executeTask(taskId);
            results.push(result);
            if (result.status === 'completed' && result.result) {
                previousOutput = result.result;
            }
            else {
                break; // Pipeline breaks on failure
            }
        }
        return results;
    }
    /**
     * Execute tasks hierarchically (manager delegates)
     */
    async executeHierarchical(taskIds) {
        // First task is the manager
        const managerTaskId = taskIds[0];
        const workerTaskIds = taskIds.slice(1);
        // Execute manager task first
        const managerResult = await this.executeTask(managerTaskId);
        // Manager decides how to delegate
        if (managerResult.status === 'completed') {
            // Execute workers in parallel
            const workerResults = await this.executeParallel(workerTaskIds);
            return [managerResult, ...workerResults];
        }
        return [managerResult];
    }
    /**
     * Send message between Agents
     */
    sendMessage(message) {
        const fullMessage = {
            ...message,
            timestamp: new Date()
        };
        this.messages.push(fullMessage);
        this.emit('message', fullMessage);
        // If direct message, emit specific event
        if (message.to !== '*') {
            this.emit(`message:${message.to}`, fullMessage);
        }
    }
    /**
     * Broadcast message to all Agents
     */
    broadcast(from, content, metadata) {
        this.sendMessage({
            from,
            to: '*',
            type: 'broadcast',
            content,
            metadata
        });
    }
    /**
     * Get message history
     */
    getMessages(filter) {
        let msgs = this.messages;
        if (filter?.from) {
            msgs = msgs.filter(m => m.from === filter.from);
        }
        if (filter?.to) {
            msgs = msgs.filter(m => m.to === filter.to || m.to === '*');
        }
        return msgs;
    }
    /**
     * Get task result
     */
    getResult(taskId) {
        return this.results.get(taskId);
    }
    /**
     * Get all results
     */
    getAllResults() {
        return Array.from(this.results.values());
    }
    /**
     * Get running tasks
     */
    getRunningTasks() {
        return Array.from(this.runningTasks);
    }
    /**
     * Wait for all tasks to complete
     */
    async waitForAll() {
        while (this.runningTasks.size > 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return this.getAllResults();
    }
    /**
     * Summarize Agent result
     */
    summarizeResult(state) {
        const steps = state.steps;
        const finalStep = steps[steps.length - 1];
        if (finalStep?.type === 'final_answer') {
            return finalStep.content;
        }
        return `Completed ${steps.length} steps`;
    }
    /**
     * Clear all data
     */
    clear() {
        this.agents.clear();
        this.agentInstances.clear();
        this.tasks.clear();
        this.results.clear();
        this.messages = [];
        this.runningTasks.clear();
    }
}
// Export factory function
export function createMultiAgentCoordinator(toolRegistry, sessionManager, config) {
    return new MultiAgentCoordinator(toolRegistry, sessionManager, config);
}
//# sourceMappingURL=MultiAgentCoordinator.js.map