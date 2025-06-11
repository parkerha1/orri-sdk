import { z } from 'zod';
import React from 'react';

/**
 * Authentication configuration for an Orri app
 */
export interface AuthConfig {
    provider: string;
    scopes: string[];
}

/**
 * Interface for a tool in an Orri app
 */
export interface OrriTool<
    TInputSchema extends z.ZodTypeAny,
    TOutputSchema extends z.ZodTypeAny
> {
    id: string;
    name: string;
    description: string;
    inputSchema: TInputSchema;
    outputSchema: TOutputSchema;
    executeAsync: (input: z.infer<TInputSchema>) => Promise<z.infer<TOutputSchema>>;
    preflightDisplay?: React.FC<PreflightDisplayProps<TInputSchema>>;
    postflightDisplay?: React.FC<PostflightDisplayProps<TOutputSchema>>;
}

/**
 * Props for a preflight display component
 */
export interface PreflightDisplayProps<TSchema extends z.ZodTypeAny> {
    input: z.infer<TSchema>;
    onInputChange: (input: z.infer<TSchema>) => void;
    onSubmit: (params: z.infer<TSchema>) => void;
    isProcessing: boolean;
}

/**
 * Props for a postflight display component
 */
export interface PostflightDisplayProps<TSchema extends z.ZodTypeAny> {
    input: z.infer<TSchema>;
}

/**
 * Interface for an Orri app
 */
export interface OrriApp {
    id: string;
    name: string;
    description: string;
    version: string;
    tools: OrriTool<any, any>[];
    auth?: AuthConfig;
}

/**
 * Manifest for an Orri app
 */
export interface OrriAppManifest {
    id: string;
    name: string;
    description: string;
    version: string;
    tools: OrriToolManifest[];
    auth?: AuthConfig;
}

/**
 * Manifest for an Orri tool
 */
export interface OrriToolManifest {
    id: string;
    name: string;
    description: string;
    inputSchema: object;
    outputSchema: object;
}

/**
 * Display information sent from host
 */
export interface DisplayInfo {
    toolId: string;
    params?: any;
}

/**
 * User action information sent to host
 */
export interface UserAction {
    actionType: string;
    data: any;
}

/**
 * Tool call information
 */
export interface ToolCallInfo {
    toolId: string;
    input: any;
    callId: string;
}

/**
 * Tool result information
 */
export interface ToolResultInfo {
    toolId: string;
    output: any;
    callId: string;
} 

export interface NetworkResponse {
    /** The parsed response data (JSON object, text, etc.) */
    data: any;
    /** HTTP status code */
    status: number;
    /** HTTP status text */
    statusText: string;
    /** Response headers as key-value pairs */
    headers: Record<string, string>;
    /** Whether the response was successful (status 200-299) */
    ok: boolean;
    /** The final URL after redirects */
    url: string;
  }