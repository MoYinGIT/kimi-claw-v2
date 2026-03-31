/**
 * BashTool - exec功能封装
 */

import { Tool, ToolInput, ToolOutput, ToolCategory, PermissionRequirement } from '../core/Tool.js';

interface BashInput extends ToolInput {
  command: string;
  cwd?: string;
  timeout?: number;  // milliseconds
  env?: Record<string, string>;
}

interface BashOutput extends ToolOutput {
  data?: {
    stdout: string;
    stderr: string;
    exitCode: number;
    command: string;
  };
}

export class BashTool extends Tool<BashInput, BashOutput> {
  readonly metadata = {
    name: 'BashTool',
    description: 'Execute shell commands',
    version: '1.0.0'
  };

  readonly permissionRequirement: PermissionRequirement = {
    level: 'high',
    destructive: true,
    reason: 'Shell commands can modify files, install software, and affect system state'
  };

  validate(input: BashInput): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    if (!input.command || typeof input.command !== 'string') {
      errors.push('command is required and must be a string');
    }

    // Check for dangerous commands
    const dangerousPatterns = [
      'rm -rf /',
      'mkfs',
      'dd if=/dev/zero',
      ':(){ :|:& };:'  // fork bomb
    ];

    for (const pattern of dangerousPatterns) {
      if (input.command?.includes(pattern)) {
        errors.push(`Command contains dangerous pattern: ${pattern}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  async execute(input: BashInput): Promise<BashOutput> {
    try {
      // In real implementation, this would call exec
      return {
        success: true,
        data: {
          stdout: 'Command output would be here',
          stderr: '',
          exitCode: 0,
          command: input.command
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  describeAction(input: BashInput): string {
    return `Execute shell command: "${input.command.substring(0, 40)}${input.command.length > 40 ? '...' : ''}"`;
  }

  sanitizeInput(input: BashInput): BashInput {
    // Remove sensitive env vars from logs
    const sanitized = { ...input };
    if (sanitized.env) {
      const sensitiveKeys = ['PASSWORD', 'SECRET', 'TOKEN', 'KEY'];
      sanitized.env = Object.fromEntries(
        Object.entries(sanitized.env).map(([k, v]) => [
          k,
          sensitiveKeys.some(sk => k.toUpperCase().includes(sk)) ? '***' : v
        ])
      );
    }
    return sanitized;
  }
}
