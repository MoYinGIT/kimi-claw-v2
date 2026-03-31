/**
 * MessageTool - message功能封装
 */
import { Tool, ToolInput, ToolOutput, PermissionRequirement } from '../core/Tool.js';
interface MessageInput extends ToolInput {
    action: 'send' | 'reply' | 'broadcast';
    target: string;
    content: string;
    channel?: string;
}
interface MessageOutput extends ToolOutput {
    data?: {
        messageId?: string;
        delivered: boolean;
        timestamp: string;
    };
}
export declare class MessageTool extends Tool<MessageInput, MessageOutput> {
    readonly metadata: {
        name: string;
        description: string;
        version: string;
    };
    readonly permissionRequirement: PermissionRequirement;
    validate(input: MessageInput): {
        valid: boolean;
        errors?: string[];
    };
    execute(input: MessageInput): Promise<MessageOutput>;
    describeAction(input: MessageInput): string;
}
export {};
//# sourceMappingURL=MessageTool.d.ts.map