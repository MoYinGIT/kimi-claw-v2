/**
 * FileReadTool - read文件功能封装
 */
import { Tool } from '../core/Tool.js';
export class FileReadTool extends Tool {
    metadata = {
        name: 'FileReadTool',
        description: 'Read contents of a file (text or image)',
        version: '1.0.0'
    };
    permissionRequirement = {
        level: 'low',
        destructive: false
    };
    validate(input) {
        const errors = [];
        if (!input.path || typeof input.path !== 'string') {
            errors.push('path is required and must be a string');
        }
        return {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        };
    }
    async execute(input) {
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
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    describeAction(input) {
        return `Read file "${input.path}"`;
    }
}
//# sourceMappingURL=FileReadTool.js.map