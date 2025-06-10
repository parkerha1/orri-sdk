import path from 'path';
import fs from 'fs';

/**
 * Generates a webpack entry point that automatically initializes the Orri app
 * This can be used during build to create the entry file
 */
export function generateAppEntry(
    appPath: string,
    outputPath: string = './src/generated-entry.tsx'
): string {
    const absoluteOutputPath = path.resolve(process.cwd(), outputPath);

    // Create the entry point content
    const entryContent = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

// Import and initialize the app
import app from '${appPath}';
(app as any).initialize?.();

// Create the root container
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<div>App loaded and initialized</div>);
}
`;

    // Write the file
    fs.writeFileSync(absoluteOutputPath, entryContent);

    return absoluteOutputPath;
}

/**
 * Webpack plugin to automatically generate entry points for Orri apps
 */
export class OrriWebpackPlugin {
    private appPath: string;
    private outputPath: string;

    constructor(options: { appPath: string; outputPath?: string }) {
        this.appPath = options.appPath;
        this.outputPath = options.outputPath || './src/generated-entry.tsx';
    }

    apply(compiler: any): void {
        compiler.hooks.beforeCompile.tapAsync(
            'OrriWebpackPlugin',
            (_: any, callback: () => void) => {
                try {
                    generateAppEntry(this.appPath, this.outputPath);
                    console.log(`Generated Orri entry point at ${this.outputPath}`);
                    callback();
                } catch (error) {
                    console.error('Error generating Orri entry point:', error);
                    callback();
                }
            }
        );
    }
} 