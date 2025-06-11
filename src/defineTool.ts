import { OrriTool } from './types';
import { z } from 'zod';

/**
 * Define an Orri tool with type safety
 */
export function defineTool<
    TInputSchema extends z.ZodTypeAny,
    TOutputSchema extends z.ZodTypeAny
>(config: OrriTool<TInputSchema, TOutputSchema>): OrriTool<TInputSchema, TOutputSchema> {
    return config;
} 