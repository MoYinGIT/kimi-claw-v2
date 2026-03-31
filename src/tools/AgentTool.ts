/**
 * AgentTool - sessions_spawn封装
 */

import { Tool, ToolInput, ToolOutput, ToolCategory, PermissionRequirement } from '../core/Tool.js';

interface AgentInput extends ToolInput {
  task: string;
  agentId?: string;
  timeout?: number;  // seconds
  mode?: 'run' | 'session';
}

interface AgentOutput extends ToolOutput {
  data?: {
    result: string;
    agentId: string;
    executionTime: number;
  };
}

export class AgentTool extends Tool<AgentInput, AgentOutput> {
  readonly metadata = {
    name: 'AgentTool',
    description: 'Spawn a sub-agent to execute a task',
    version: '1.0.0'
  };

  readonly permissionRequirement: PermissionRequirement = {
    level: 'high',
    destructive: false,
    reason: 'Spawning sub-agents consumes resources and may perform autonomous actions'
  };

  validate(input: AgentInput): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    if (!input.task || typeof input.task !== 'string') {
      errors.push('task is required and must be a string');
    }

    if (input.timeout !== undefined && (typeof input.timeout !== 'number' || input.timeout < 1)) {
      errors.push('timeout must be a positive number');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  async execute(input: AgentInput): Promise<AgentOutput> {
    try {
      // In real implementation, this would call sessions_spawn
      return {
        success: true,
        data: {
          result: `Sub-agent completed task: ${input.task}`,
          agentId: input.agentId || `agent-${Date.now()}`,
          executionTime: input.timeout || 60
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  describeAction(input: AgentInput): string {
    return `Spawn sub-agent to execute: "${input.task.substring(0, 50)}${input.task.length > 50 ? '...' : ''}"`;
  }
}
