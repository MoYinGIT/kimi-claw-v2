/**
 * Tool Interface Definition
 * Inspired by Claude Code's Tool System
 * 
 * Core abstraction for all capabilities in KIMI CLAW
 */

export interface ToolMetadata {
  name: string;
  description: string;
  version: string;
  author?: string;
}

export interface ToolInput {
  [key: string]: unknown;
}

export interface ToolOutput {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: {
    executionTime?: number;
    tokensUsed?: number;
  };
}

export interface ToolProgress {
  status: 'pending' | 'running' | 'completed' | 'failed';
  message?: string;
  percent?: number;
}

export interface PermissionRequirement {
  level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  reason?: string;
  destructive?: boolean;
}

export abstract class Tool<Input extends ToolInput = ToolInput, Output extends ToolOutput = ToolOutput> {
  abstract readonly metadata: ToolMetadata;
  abstract readonly permissionRequirement: PermissionRequirement;

  /**
   * Validate input parameters before execution
   * @param input Tool input parameters
   * @returns Validation result
   */
  abstract validate(input: Input): { valid: boolean; errors?: string[] };

  /**
   * Execute the tool
   * @param input Tool input parameters
   * @returns Tool execution result
   */
  abstract execute(input: Input): Promise<Output>;

  /**
   * Check if tool is enabled (feature flag check)
   * Override for feature-gated tools
   */
  isEnabled(): boolean {
    return true;
  }

  /**
   * Check if tool is read-only (no side effects)
   * Used for permission optimization
   */
  isReadOnly(): boolean {
    return this.permissionRequirement.destructive !== true;
  }

  /**
   * Get human-readable description of what this tool does
   * Used for permission prompts
   */
  describeAction(input: Input): string {
    return `Execute ${this.metadata.name}`;
  }

  /**
   * Transform input for logging (remove sensitive data)
   */
  sanitizeInput(input: Input): Input {
    return input;
  }

  /**
   * Transform output for display
   */
  formatOutput(output: Output): string {
    if (!output.success) {
      return `Error: ${output.error || 'Unknown error'}`;
    }
    return JSON.stringify(output.data, null, 2);
  }
}

/**
 * Tool Registry Entry
 */
export interface RegisteredTool {
  tool: Tool;
  category: string;
  tags: string[];
}

/**
 * Tool Categories
 */
export enum ToolCategory {
  SEARCH = 'search',
  FETCH = 'fetch',
  FILE = 'file',
  AGENT = 'agent',
  EXEC = 'exec',
  MESSAGE = 'message',
  ANALYSIS = 'analysis',
  UTILITY = 'utility'
}
