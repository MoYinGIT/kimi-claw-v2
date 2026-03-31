/**
 * FileReadTool - read文件功能封装
 */

import { Tool, ToolInput, ToolOutput, ToolCategory, PermissionRequirement } from '../core/Tool.js';

interface FileReadInput extends ToolInput {
  path: string;
  offset?: number;
  limit?: number;
}

interface FileReadOutput extends ToolOutput {
  data?: {
    content: string;
    path: string;
    size: number;
    lines: number;
  };
}

export class FileReadTool extends Tool<FileReadInput, FileReadOutput> {
  readonly metadata = {
    name: 'FileReadTool',
    description: 'Read contents of a file (text or image)',
    version: '1.0.0'
  };

  readonly permissionRequirement: PermissionRequirement = {
    level: 'low',
    destructive: false
  };

  validate(input: FileReadInput): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    if (!input.path || typeof input.path !== 'string') {
      errors.push('path is required and must be a string');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  async execute(input: FileReadInput): Promise<FileReadOutput> {
    try {
      // In real implementation, this would call the actual read function
      // For now, return a mock response
      return {
        success: true,
        data: {
          content: 'File content would be here in production',
          path: input.path,
          size: 1024,
          lines: 50
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  describeAction(input: FileReadInput): string {
    return `Read file "${input.path}"`;
  }
}
