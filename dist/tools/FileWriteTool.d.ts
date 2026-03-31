/**
 * FileWriteTool - write文件功能封装
 */
import { Tool, ToolInput, ToolOutput, PermissionRequirement } from '../core/Tool.js';
interface FileWriteInput extends ToolInput {
    path: string;
    content: string;
    append?: boolean;
}
interface FileWriteOutput extends ToolOutput {
    data?: {
        path: string;
        bytesWritten: number;
        operation: 'created' | 'overwritten' | 'appended';
    };
}
export declare class FileWriteTool extends Tool<FileWriteInput, FileWriteOutput> {
    readonly metadata: {
        name: string;
        description: string;
        version: string;
    };
    readonly permissionRequirement: PermissionRequirement;
    validate(input: FileWriteInput): {
        valid: boolean;
        errors?: string[];
    };
    execute(input: FileWriteInput): Promise<FileWriteOutput>;
    describeAction(input: FileWriteInput): string;
}
export {};
//# sourceMappingURL=FileWriteTool.d.ts.map