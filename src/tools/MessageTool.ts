/**
 * MessageTool - message功能封装
 */

import { Tool, ToolInput, ToolOutput, ToolCategory, PermissionRequirement } from '../core/Tool.js';

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

export class MessageTool extends Tool<MessageInput, MessageOutput> {
  readonly metadata = {
    name: 'MessageTool',
    description: 'Send messages via various channels (Discord, Telegram, etc.)',
    version: '1.0.0'
  };

  readonly permissionRequirement: PermissionRequirement = {
    level: 'medium',
    destructive: false,
    reason: 'Messages are sent externally and cannot be unsent'
  };

  validate(input: MessageInput): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    if (!input.action || !['send', 'reply', 'broadcast'].includes(input.action)) {
      errors.push('action must be one of: send, reply, broadcast');
    }

    if (!input.target || typeof input.target !== 'string') {
      errors.push('target is required');
    }

    if (!input.content || typeof input.content !== 'string') {
      errors.push('content is required');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  async execute(input: MessageInput): Promise<MessageOutput> {
    try {
      // In real implementation, this would call message
      return {
        success: true,
        data: {
          messageId: `msg-${Date.now()}`,
          delivered: true,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  describeAction(input: MessageInput): string {
    return `${input.action} message to ${input.target}: "${input.content.substring(0, 30)}${input.content.length > 30 ? '...' : ''}"`;
  }
}
