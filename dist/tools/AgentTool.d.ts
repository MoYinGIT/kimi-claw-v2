/**
 * AgentTool - sessions_spawn封装
 */
import { Tool, ToolInput, ToolOutput, PermissionRequirement } from '../core/Tool.js';
interface AgentInput extends ToolInput {
    task: string;
    agentId?: string;
    timeout?: number;
    mode?: 'run' | 'session';
}
interface AgentOutput extends ToolOutput {
    data?: {
        result: string;
        agentId: string;
        executionTime: number;
    };
}
export declare class AgentTool extends Tool<AgentInput, AgentOutput> {
    readonly metadata: {
        name: string;
        description: string;
        version: string;
    };
    readonly permissionRequirement: PermissionRequirement;
    validate(input: AgentInput): {
        valid: boolean;
        errors?: string[];
    };
    execute(input: AgentInput): Promise<AgentOutput>;
    describeAction(input: AgentInput): string;
}
export {};
//# sourceMappingURL=AgentTool.d.ts.map