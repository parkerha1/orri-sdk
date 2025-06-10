import { OrriTool } from './types';
import { z } from 'zod';

/**
 * Define an Orri tool with type safety
 */
export function defineTool<
    TInputSchema extends z.ZodObject<any>,
    TOutputSchema extends z.ZodObject<any>
>(config: OrriTool<TInputSchema, TOutputSchema>): OrriTool<TInputSchema, TOutputSchema> {
    return config;
} 