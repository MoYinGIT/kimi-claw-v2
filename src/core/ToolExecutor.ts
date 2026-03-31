/**
 * Tool Executor
 * Handles permission checks, execution, and result processing
 */

import { Tool, ToolOutput, PermissionRequirement } from './Tool.js';
import { ToolRegistry } from './ToolRegistry.js';
import { PermissionConfig } from './PermissionManager.js';

export interface ExecutionContext {
  sessionId: string;
  userId: string;
  timestamp: Date;
  permissions: PermissionConfig;
}

export interface ExecutionResult {
  toolName: string;
  input: unknown;
  output: ToolOutput;
  permissionDecision: 'allowed' | 'denied' | 'asked';
  executionTime: number;
  timestamp: Date;
}

export type PermissionPrompt = {
  type: 'permission_request';
  toolName: string;
  action: string;
  permissionLevel: string;
  reason?: string;
};

export class ToolExecutor {
  private registry: ToolRegistry;
  private executionHistory: ExecutionResult[] = [];

  constructor(registry: ToolRegistry) {
    this.registry = registry;
  }

  /**
   * Check permission for a tool execution
   */
  checkPermission(
    tool: Tool,
    input: unknown,
    config: PermissionConfig
  ): { decision: 'allowed' | 'denied' | 'ask'; reason?: string } {
    const name = tool.metadata.name;
    const rules = config.rules;

    // Check always deny list
    if (this.matchesPattern(name, rules.alwaysDeny)) {
      return { decision: 'denied', reason: 'Tool is in always-deny list' };
    }

    // Check always allow list
    if (this.matchesPattern(name, rules.alwaysAllow)) {
      return { decision: 'allowed' };
    }

    // Check always ask list
    if (this.matchesPattern(name, rules.alwaysAsk)) {
      return { 
        decision: 'ask',
        reason: tool.describeAction(input as Parameters<typeof tool.describeAction>[0])
      };
    }

    // Default based on permission level
    const level = tool.permissionRequirement.level;
    switch (level) {
      case 'none':
      case 'low':
        return { decision: 'allowed' };
      case 'medium':
      case 'high':
      case 'critical':
        return {
          decision: 'ask',
          reason: tool.describeAction(input as Parameters<typeof tool.describeAction>[0])
        };
      default:
        return { decision: 'ask' };
    }
  }

  /**
   * Execute a tool with full lifecycle management
   */
  async execute(
    toolName: string,
    input: unknown,
    context: ExecutionContext,
    userConfirm?: boolean
  ): Promise<ExecutionResult | PermissionPrompt> {
    const tool = this.registry.get(toolName);
    
    if (!tool) {
      return {
        toolName,
        input,
        output: {
          success: false,
          error: `Tool '${toolName}' not found`
        },
        permissionDecision: 'denied',
        executionTime: 0,
        timestamp: new Date()
      };
    }

    // Check permissions
    const permissionCheck = this.checkPermission(tool, input, context.permissions);

    if (permissionCheck.decision === 'denied') {
      return {
        toolName,
        input,
        output: {
          success: false,
          error: `Permission denied: ${permissionCheck.reason}`
        },
        permissionDecision: 'denied',
        executionTime: 0,
        timestamp: new Date()
      };
    }

    if (permissionCheck.decision === 'ask') {
      // Return permission prompt if not confirmed
      if (userConfirm === undefined) {
        return {
          type: 'permission_request',
          toolName,
          action: permissionCheck.reason || `Execute ${toolName}`,
          permissionLevel: tool.permissionRequirement.level,
          reason: tool.permissionRequirement.reason
        };
      }

      // User denied
      if (!userConfirm) {
        return {
          toolName,
          input,
          output: {
            success: false,
            error: 'User denied permission'
          },
          permissionDecision: 'denied',
          executionTime: 0,
          timestamp: new Date()
        };
      }
    }

    // Execute the tool
    const startTime = Date.now();
    let output: ToolOutput;

    try {
      output = await tool.execute(input as Parameters<typeof tool.execute>[0]);
    } catch (error) {
      output = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    const executionTime = Date.now() - startTime;

    const result: ExecutionResult = {
      toolName,
      input: tool.sanitizeInput(input as Parameters<typeof tool.sanitizeInput>[0]),
      output,
      permissionDecision: permissionCheck.decision === 'ask' && userConfirm ? 'asked' : 'allowed',
      executionTime,
      timestamp: new Date()
    };

    // Record execution
    this.executionHistory.push(result);

    return result;
  }

  /**
   * Get execution history
   */
  getHistory(): ExecutionResult[] {
    return [...this.executionHistory];
  }

  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.executionHistory = [];
  }

  /**
   * Check if a tool name matches any pattern in the list
   * Supports wildcards: * matches any sequence
   */
  private matchesPattern(name: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
      if (pattern === name) return true;
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(name);
      }
      return false;
    });
  }
}
