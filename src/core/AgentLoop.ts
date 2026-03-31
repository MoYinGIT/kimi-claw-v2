/**
 * Agent Loop - Core multi-turn reasoning engine
 * Transforms single-response system into true Agent
 */

import { ToolExecutor, ExecutionContext, ExecutionResult } from './ToolExecutor.js';
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
export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  maxSteps: 10,
  maxTokens: 8000,
  autoApproveTools: ['WebSearchTool', 'FileReadTool'],
  requireConfirmation: true,
  stopOnError: true,
  enableStreaming: false
};

/**
 * Agent Loop - Multi-turn reasoning engine
 */
export class AgentLoop {
  private executor: ToolExecutor;
  private sessionManager: SessionManager;
  private config: AgentConfig;
  private state: AgentState;
  private onStep?: (step: AgentStep) => void;
  private onComplete?: (state: AgentState) => void;
  private onError?: (error: Error) => void;

  constructor(
    toolRegistry: ToolRegistry,
    sessionManager: SessionManager,
    config: Partial<AgentConfig> = {}
  ) {
    this.executor = new ToolExecutor(toolRegistry);
    this.sessionManager = sessionManager;
    this.config = { ...DEFAULT_AGENT_CONFIG, ...config };
    this.state = {
      query: '',
      steps: [],
      isRunning: false,
      isComplete: false,
      contextWindow: {
        currentTokens: 0,
        maxTokens: this.config.maxTokens
      }
    };
  }

  /**
   * Set event handlers
   */
  setHandlers(handlers: {
    onStep?: (step: AgentStep) => void;
    onComplete?: (state: AgentState) => void;
    onError?: (error: Error) => void;
  }): void {
    this.onStep = handlers.onStep;
    this.onComplete = handlers.onComplete;
    this.onError = handlers.onError;
  }

  /**
   * Execute agent loop for a user query
   */
  async run(query: string, context: ExecutionContext): Promise<AgentState> {
    this.state = {
      query,
      steps: [],
      isRunning: true,
      isComplete: false,
      contextWindow: {
        currentTokens: this.estimateTokens(query),
        maxTokens: this.config.maxTokens
      }
    };

    try {
      // Initial thought
      await this.addStep({
        type: 'thought',
        content: `Analyzing query: "${query}"`
      });

      let stepCount = 0;
      
      while (stepCount < this.config.maxSteps) {
        stepCount++;
        
        // Check if we should continue
        if (this.state.isComplete || this.state.error) {
          break;
        }

        // Check token limit
        if (this.state.contextWindow.currentTokens > this.config.maxTokens * 0.9) {
          await this.addStep({
            type: 'error',
            content: 'Context window limit approaching. Stopping loop.'
          });
          break;
        }

        // Determine next action (thought → tool_call → thought...)
        const nextAction = await this.determineNextAction();

        if (nextAction.type === 'final_answer') {
          await this.addStep({
            type: 'final_answer',
            content: nextAction.content
          });
          this.state.isComplete = true;
          break;
        }

        if (nextAction.type === 'tool_call') {
          const toolResult = await this.executeTool(
            nextAction.toolName!,
            nextAction.toolInput,
            context
          );
          
          if (toolResult.success) {
            await this.addStep({
              type: 'tool_result',
              content: `Tool ${nextAction.toolName} executed successfully`,
              metadata: {
                toolName: nextAction.toolName,
                toolInput: nextAction.toolInput,
                toolOutput: toolResult.data
              }
            });
          } else {
            await this.addStep({
              type: 'error',
              content: `Tool ${nextAction.toolName} failed: ${toolResult.error}`
            });
            
            if (this.config.stopOnError) {
              this.state.error = toolResult.error;
              break;
            }
          }
        }

        if (nextAction.type === 'thought') {
          await this.addStep({
            type: 'thought',
            content: nextAction.content
          });
        }
      }

      // Max steps reached
      if (stepCount >= this.config.maxSteps && !this.state.isComplete) {
        await this.addStep({
          type: 'error',
          content: `Maximum steps (${this.config.maxSteps}) reached. Task may be incomplete.`
        });
      }

    } catch (error) {
      this.state.error = error instanceof Error ? error.message : String(error);
      await this.addStep({
        type: 'error',
        content: this.state.error
      });
      this.onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.state.isRunning = false;
      this.onComplete?.(this.state);
    }

    return this.state;
  }

  /**
   * Determine next action based on current state
   * In real implementation, this would call LLM API
   */
  private async determineNextAction(): Promise<{
    type: 'thought' | 'tool_call' | 'final_answer';
    content?: string;
    toolName?: string;
    toolInput?: unknown;
  }> {
    // Mock implementation - in real code, this calls LLM
    const lastStep = this.state.steps[this.state.steps.length - 1];
    
    // If no tool has been called yet, decide to call one
    if (!this.state.steps.some(s => s.type === 'tool_call')) {
      // Parse query to determine which tool to use
      if (this.state.query.includes('search') || this.state.query.includes('find')) {
        return {
          type: 'tool_call',
          toolName: 'WebSearchTool',
          toolInput: { query: this.state.query }
        };
      }
      
      if (this.state.query.includes('read') || this.state.query.includes('file')) {
        return {
          type: 'tool_call',
          toolName: 'FileReadTool',
          toolInput: { path: './example.txt' }
        };
      }
    }

    // If tool result just received, think about it or provide final answer
    if (lastStep?.type === 'tool_result') {
      // For demo, complete after one tool call
      return {
        type: 'final_answer',
        content: `Based on the tool execution, I have gathered the necessary information to answer your query: "${this.state.query}"`
      };
    }

    // Default: thinking step
    return {
      type: 'thought',
      content: 'Processing previous results and determining next steps...'
    };
  }

  /**
   * Execute a tool
   */
  private async executeTool(
    toolName: string,
    input: unknown,
    context: ExecutionContext
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    await this.addStep({
      type: 'tool_call',
      content: `Calling ${toolName}...`,
      metadata: { toolName, toolInput: input }
    });

    const result = await this.executor.execute(
      toolName,
      input,
      context,
      this.config.autoApproveTools.includes(toolName)
    );

    if ('type' in result && result.type === 'permission_request') {
      return {
        success: false,
        error: `Permission required: ${result.action}`
      };
    }

    const execResult = result as ExecutionResult;
    return {
      success: execResult.output.success,
      data: execResult.output.data,
      error: execResult.output.error
    };
  }

  /**
   * Add a step to the agent state
   */
  private async addStep(partialStep: Omit<AgentStep, 'stepNumber' | 'timestamp'>): Promise<void> {
    const step: AgentStep = {
      ...partialStep,
      stepNumber: this.state.steps.length + 1,
      timestamp: new Date().toISOString()
    };

    this.state.steps.push(step);
    
    // Update token count
    this.state.contextWindow.currentTokens += this.estimateTokens(step.content);

    // Persist to session
    this.sessionManager.appendMessage({
      role: step.type === 'tool_call' || step.type === 'tool_result' ? 'tool' : 'assistant',
      content: step.content,
      metadata: step.metadata
    });

    // Notify listeners
    this.onStep?.(step);
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Very rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Get current state
   */
  getState(): AgentState {
    return { ...this.state };
  }

  /**
   * Check if agent is running
   */
  isRunning(): boolean {
    return this.state.isRunning;
  }

  /**
   * Stop the agent loop
   */
  stop(): void {
    this.state.isRunning = false;
    this.addStep({
      type: 'thought',
      content: 'Agent loop stopped by user.'
    });
  }

  /**
   * Reset agent state
   */
  reset(): void {
    this.state = {
      query: '',
      steps: [],
      isRunning: false,
      isComplete: false,
      contextWindow: {
        currentTokens: 0,
        maxTokens: this.config.maxTokens
      }
    };
  }
}

// Export singleton factory
export function createAgentLoop(
  toolRegistry: ToolRegistry,
  sessionManager: SessionManager,
  config?: Partial<AgentConfig>
): AgentLoop {
  return new AgentLoop(toolRegistry, sessionManager, config);
}
