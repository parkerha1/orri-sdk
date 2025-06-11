// utils/OrriCommunication.ts
import { OrriApp, OrriTool, AuthConfig } from './types';
import {
    EventType,
    UserActionType,
    Message,
    DisplayEvent,
    ToolCallEvent,
    ToolResultEvent,
    UserActionEvent,
    NetworkRequestEvent,
    NetworkResponseEvent,
    AuthEvent,
    InitializeEvent,
} from './messages';

/* -------------------------------------------------------------------------- */
/* Event & message types                                                      */
/* -------------------------------------------------------------------------- */
// Duplicate definitions removed; they now live in messages.ts

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */
type EventListener = (payload: any) => void;
const listeners: Record<string, EventListener[]> = {};
const hasRNBridge = () =>
    !!(window && window.ReactNativeWebView && window.ReactNativeWebView.postMessage);

/* -------------------------------------------------------------------------- */
/* Communication singleton                                                    */
/* -------------------------------------------------------------------------- */
export class OrriCommunication {
    private static instance: OrriCommunication;
    private app: OrriApp | null = null;
    private tools = new Map<string, OrriTool<any, any>>();
    private pendingNetworkRequests = new Map<string, {
        resolve: (value: Response) => void,
        reject: (reason: any) => void
    }>();

    private constructor() {
        // In React Native's JS runtime, window.addEventListener does not exist.
        // Guard against that to avoid "window.addEventListener is not a function" errors
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            window.addEventListener('message', this.handleMessage.bind(this));
        }
    }

    /* --------------------------- lifecycle ---------------------------------- */
    public static getInstance(): OrriCommunication {
        return (this.instance ??= new OrriCommunication());
    }

    public initialize(app: OrriApp) {
        console.log('bridge?', !!window.ReactNativeWebView)
        this.app = app;
        app.tools.forEach(t => this.tools.set(t.id, t));
        console.log('SENDING INITIALIZE: ', app);
        this.send({
            type: EventType.INITIALIZE,
            payload: {
                appId: app.id,
                version: app.version,
                tools: app.tools.map(({ id, name, description }) => ({
                    id,
                    name,
                    description,
                })),
                auth: app.auth || null,
            } as InitializeEvent,
        });
    }

    /* --------------------------- inbound ------------------------------------ */
    private handleMessage(e: MessageEvent) {
        console.log('handleMessage', e.data);
        try {
            const msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
            if (msg && typeof msg === 'object') this.route(msg as Message);
        } catch (err) {
            console.error('handleMessage parse error', err, e.data);
        }
    }

    private route(message: Message) {
        console.log('route', message);
        switch (message.type) {
            case EventType.DISPLAY:
                this.dispatch(EventType.DISPLAY, message.payload as DisplayEvent);
                break;
            case EventType.TOOL_CALL:
                this.execTool(message.payload as ToolCallEvent);
                break;
            case EventType.NETWORK_RESPONSE:
                this.handleNetworkResponse(message.payload as NetworkResponseEvent);
                break;
            case EventType.INITIALIZE:
                console.log('INITIALIZE: ', this.app);
                this.send({
                    type: EventType.INITIALIZE,
                    payload: {
                        appId: this.app?.id,
                        version: this.app?.version,
                        tools: this.app?.tools.map(({ id, name, description }) => ({
                            id,
                            name,
                            description,
                        })),
                        auth: this.app?.auth || null,
                    } as InitializeEvent,
                });
                break;
            case EventType.AUTH:
                this.dispatch(EventType.AUTH, message.payload as AuthEvent);
                break;
            default:
                this.dispatch(message.type, message.payload);
        }
    }

    private async execTool({ toolId, input, callId }: ToolCallEvent) {
        const tool = this.tools.get(toolId);
        if (!tool) {
            this.error(`Tool ${toolId} not found`, callId);
            return;
        }
        try {
            console.log('Executing tool:', toolId, input);
            const output = await tool.executeAsync(input);
            this.send({
                type: EventType.TOOL_RESULT,
                payload: {
                    toolId,
                    output,
                    callId,
                    success: true,
                    message: 'Operation completed successfully'
                },
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            this.send({
                type: EventType.TOOL_RESULT,
                payload: {
                    toolId,
                    output: null,
                    callId,
                    success: false,
                    message: errorMessage
                }
            });
        }
    }

    private handleNetworkResponse(payload: NetworkResponseEvent): void {
        const { requestId, response, error, success } = payload;
        const pendingRequest = this.pendingNetworkRequests.get(requestId);

        if (pendingRequest) {
            if (success && response) {
                pendingRequest.resolve(response);
            } else {
                pendingRequest.reject(error || 'Network request failed');
            }
            this.pendingNetworkRequests.delete(requestId);
        }
    }

    /* --------------------------- outbound ----------------------------------- */
    /**
     * Send a user action to the host
     * @param actionType The type of action (must use UserActionType enum)
     * @param data The data associated with the action
     */
    public sendUserAction(actionType: UserActionType, data: any) {
        this.send({ type: EventType.USER_ACTION, payload: { actionType, data } });
    }

    public fetch(url: string, options?: RequestInit): Promise<Response> {
        const requestId = crypto.randomUUID ? crypto.randomUUID() : `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        return new Promise((resolve, reject) => {
            // Store the promise callbacks
            this.pendingNetworkRequests.set(requestId, { resolve, reject });

            // Send the request to the host
            this.send({
                type: EventType.NETWORK_REQUEST,
                payload: { url, options, requestId }
            });
        });
    }

    private send(message: Message) {
        console.log('SENDING: ', message);
        if (hasRNBridge()) {
            window.ReactNativeWebView!.postMessage(JSON.stringify(message));
        } else {
            // dev / browser preview
            console.log('[OrriCommunication] → host:', message);
        }
    }

    private error(msg: string, callId?: string) {
        this.send({ type: EventType.ERROR, payload: { message: msg, callId } });
    }

    /* --------------------------- event bus ---------------------------------- */
    public addEventListener(type: EventType, listener: EventListener) {
        (listeners[type] ??= []).push(listener);
    }

    public removeEventListener(type: EventType, listener: EventListener) {
        listeners[type] = (listeners[type] || []).filter(l => l !== listener);
    }

    private dispatch(type: EventType, payload: any) {
        (listeners[type] || []).forEach(l => {
            try { l(payload) } catch (e) { console.error(`listener ${type}`, e) }
        });
    }

    /* --------------------------- utils -------------------------------------- */
    public getTool(id: string) { return this.tools.get(id) }
    public getRegisteredTools() { return new Map(this.tools) }
    public getAuthConfig(): AuthConfig | null { return this.app?.auth || null; }
}

/* -------------------------------------------------------------------------- */
/* global typings                                                             */
/* -------------------------------------------------------------------------- */
declare global {
    interface Window {
        ReactNativeWebView?: { postMessage: (msg: string) => void }
    }
}

/* -------------------------------------------------------------------------- */
/* exported singleton                                                         */
/* -------------------------------------------------------------------------- */
export const orriCommunication = OrriCommunication.getInstance();

/**
 * Sends a network request event to the host application
 * @param url The URL to fetch
 * @param options Optional request options (follows the Fetch API RequestInit interface)
 * @returns Promise that resolves with the Response from the host application
 */
export const fetch = (url: string, options?: RequestInit): Promise<Response> => {
    return orriCommunication.fetch(url, options);
};

export {
    EventType,
    UserActionType,
    Message,
    DisplayEvent,
    ToolCallEvent,
    ToolResultEvent,
    UserActionEvent,
    NetworkRequestEvent,
    NetworkResponseEvent,
    AuthEvent,
    InitializeEvent,
};
