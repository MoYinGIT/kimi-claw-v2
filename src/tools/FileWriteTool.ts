/**
 * FileWriteTool - write文件功能封装
 */

import { Tool, ToolInput, ToolOutput, ToolCategory, PermissionRequirement } from '../core/Tool.js';

interface FileWriteInput extends ToolInput {
  path: string;
  content: string;
  append?: boolean;  // false = overwrite, true = append
}

interface FileWriteOutput extends ToolOutput {
  data?: {
    path: string;
    bytesWritten: number;
    operation: 'created' | 'overwritten' | 'appended';
  };
}

export class FileWriteTool extends Tool<FileWriteInput, FileWriteOutput> {
  readonly metadata = {
    name: 'FileWriteTool',
    description: 'Write or append content to a file',
    version: '1.0.0'
  };

  readonly permissionRequirement: PermissionRequirement = {
    level: 'medium',
    destructive: true,  // Can overwrite files
    reason: 'This tool can create, overwrite, or modify files'
  };

  validate(input: FileWriteInput): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    if (!input.path || typeof input.path !== 'string') {
      errors.push('path is required and must be a string');
    }

    if (input.content === undefined || typeof input.content !== 'string') {
      errors.push('content is required and must be a string');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  async execute(input: FileWriteInput): Promise<FileWriteOutput> {
    try {
      // In real implementation, this would call the actual write function
      const operation = input.append ? 'appended' : 'overwritten';
      
      return {
        success: true,
        data: {
          path: input.path,
          bytesWritten: input.content.length,
          operation
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  describeAction(input: FileWriteInput): string {
    const action = input.append ? 'Append to' : 'Write to';
    return `${action} file "${input.path}" (${input.content.length} bytes)`;
  }
}
