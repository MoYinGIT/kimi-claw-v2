/**
 * BashTool - exec功能封装
 */
import { Tool, ToolInput, ToolOutput, PermissionRequirement } from '../core/Tool.js';
interface BashInput extends ToolInput {
    command: string;
    cwd?: string;
    timeout?: number;
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
export declare class BashTool extends Tool<BashInput, BashOutput> {
    readonly metadata: {
        name: string;
        description: string;
        version: string;
    };
    readonly permissionRequirement: PermissionRequirement;
    validate(input: BashInput): {
        valid: boolean;
        errors?: string[];
    };
    execute(input: BashInput): Promise<BashOutput>;
    describeAction(input: BashInput): string;
    sanitizeInput(input: BashInput): BashInput;
}
export {};
//# sourceMappingURL=BashTool.d.ts.map