/**
 * FileWriteTool - write文件功能封装
 */
import { Tool } from '../core/Tool.js';
export class FileWriteTool extends Tool {
    metadata = {
        name: 'FileWriteTool',
        description: 'Write or append content to a file',
        version: '1.0.0'
    };
    permissionRequirement = {
        level: 'medium',
        destructive: true, // Can overwrite files
        reason: 'This tool can create, overwrite, or modify files'
    };
    validate(input) {
        const errors = [];
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
    async execute(input) {
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
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    describeAction(input) {
        const action = input.append ? 'Append to' : 'Write to';
        return `${action} file "${input.path}" (${input.content.length} bytes)`;
    }
}
//# sourceMappingURL=FileWriteTool.js.map