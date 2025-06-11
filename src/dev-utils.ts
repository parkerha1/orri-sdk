import { orriCommunication } from './communication';
import { EventType, Message } from './messages';
import { DisplayInfo, ToolCallInfo } from './types';

/**
 * Development utilities for testing Orri SDK without a host
 */
export class OrriDevUtils {
    private static instance: OrriDevUtils;

    private constructor() {
        // Listen for messages that would go to the host
        window.addEventListener('orriHostMessage', ((event: CustomEvent<Message>) => {
            console.log('Intercepted message to host:', event.detail);
        }) as EventListener);
    }

    public static getInstance(): OrriDevUtils {
        if (!OrriDevUtils.instance) {
            OrriDevUtils.instance = new OrriDevUtils();
        }
        return OrriDevUtils.instance;
    }

    /**
     * Simulate a display event from host
     */
    public simulateDisplayEvent(toolId: string, params?: any): void {
        this.simulateHostMessage({
            type: EventType.DISPLAY,
            payload: {
                toolId,
                params
            }
        });
    }

    /**
     * Simulate a tool call event from host
     */
    public simulateToolCall(toolId: string, input: any, callId: string = this.generateCallId()): string {
        this.simulateHostMessage({
            type: EventType.TOOL_CALL,
            payload: {
                toolId,
                input,
                callId
            }
        });
        return callId;
    }

    /**
     * Simulate a custom event from host
     */
    public simulateCustomEvent(type: string, payload: any): void {
        this.simulateHostMessage({
            type: type as EventType,
            payload
        });
    }

    /**
     * Simulate receiving a message from host
     */
    private simulateHostMessage(message: Message): void {
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
        } else {
            console.error('receiveMessageFromHost not available. Make sure app is initialized');
        }
    }

    /**
     * Generate a random call ID for testing
     */
    private generateCallId(): string {
        return `test-${Math.random().toString(36).substring(2, 9)}`;
    }
}

export const orriDevUtils = OrriDevUtils.getInstance(); 