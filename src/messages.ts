import type { AuthConfig, NetworkResponse } from './types';

/* -------------------------------------------------------------------------- */
/* Event & message types (side-effect-free)                                    */
/* -------------------------------------------------------------------------- */
export enum EventType {
    DISPLAY = 'DISPLAY',
    USER_ACTION = 'USER_ACTION',
    TOOL_CALL = 'TOOL_CALL',
    TOOL_RESULT = 'TOOL_RESULT',
    INITIALIZE = 'INITIALIZE',
    ERROR = 'ERROR',
    NETWORK_REQUEST = 'NETWORK_REQUEST',
    NETWORK_RESPONSE = 'NETWORK_RESPONSE',
    AUTH = 'AUTH',
}

/**
 * Standard user action types that can be sent to the host
 */
export enum UserActionType {
    INPUT_CHANGED = 'input_changed',
    CONFIRM = 'confirm',
    CANCEL = 'cancel',
    AUTH = 'auth',
    NAVIGATE = 'navigate',
    REFRESH = 'refresh',
}

export interface Message {
    type: EventType;
    payload: any;
}

export enum DisplayStage {
    PREFLIGHT = 'preflight',
    POSTFLIGHT = 'postflight',
    AUTH = 'auth'
}

export interface DisplayEvent {
    toolId: string;
    stage: DisplayStage;
    input?: any;
}

export interface ToolCallEvent { toolId: string; input: any; callId: string }
export interface ToolResultEvent {
    toolId: string;
    output: any;
    callId: string;
    success: boolean;
    message?: string;
}
export interface UserActionEvent { actionType: UserActionType; data: any }
export interface NetworkRequestEvent { url: string; options?: RequestInit; requestId: string }
export interface NetworkResponseEvent {
    requestId: string;
    response: any;
    success: boolean;
}
export interface AuthEvent { provider: string; scopes: string[] }

/**
 * Payload structure for the initialize event
 */
export interface InitializeEvent {
    appId: string;
    version: string;
    tools: {
        id: string;
        name: string;
        description: string;
    }[];
    auth: AuthConfig | null;
}

// Re-export AuthConfig for convenience so callers don't need a second import
export type { AuthConfig }; 