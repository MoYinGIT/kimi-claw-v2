/**
 * WebSearchTool - kimi_search封装
 */
import { Tool, ToolInput, ToolOutput, PermissionRequirement } from '../core/Tool.js';
interface WebSearchInput extends ToolInput {
    query: string;
    limit?: number;
    country?: string;
    freshness?: 'day' | 'week' | 'month' | 'year';
}
interface WebSearchOutput extends ToolOutput {
    data?: {
        results: Array<{
            title: string;
            url: string;
            summary: string;
            date?: string;
        }>;
        query: string;
        totalResults: number;
    };
}
export declare class WebSearchTool extends Tool<WebSearchInput, WebSearchOutput> {
    readonly metadata: {
        name: string;
        description: string;
        version: string;
    };
    readonly permissionRequirement: PermissionRequirement;
    validate(input: WebSearchInput): {
        valid: boolean;
        errors?: string[];
    };
    execute(input: WebSearchInput): Promise<WebSearchOutput>;
    describeAction(input: WebSearchInput): string;
}
export {};
//# sourceMappingURL=WebSearchTool.d.ts.map