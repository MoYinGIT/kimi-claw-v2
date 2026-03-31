/**
 * FileReadTool - read文件功能封装
 */
import { Tool, ToolInput, ToolOutput, PermissionRequirement } from '../core/Tool.js';
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
export declare class FileReadTool extends Tool<FileReadInput, FileReadOutput> {
    readonly metadata: {
        name: string;
        description: string;
        version: string;
    };
    readonly permissionRequirement: PermissionRequirement;
    validate(input: FileReadInput): {
        valid: boolean;
        errors?: string[];
    };
    execute(input: FileReadInput): Promise<FileReadOutput>;
    describeAction(input: FileReadInput): string;
}
export {};
//# sourceMappingURL=FileReadTool.d.ts.map