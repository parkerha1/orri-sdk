import React from 'react';
import { orriCommunication, EventType, UserActionType } from './communication';
import { OrriTool, AuthConfig } from './types';
import { DisplayEvent, DisplayStage } from './messages';
// Display router component props
export interface DisplayRouterProps {
    loadingComponent?: React.ReactNode;
    errorComponent?: React.FC<{ displayId: string; toolId?: string; stage?: string }>;
    appName?: string;
}

// Display types


// Auth display component props
export interface AuthDisplayProps {
    appName: string;
    provider: string;
    scopes: string[];
    onAuth: (provider: string, scopes: string[]) => void;
}

// Auth display component
export const AuthDisplay: React.FC<AuthDisplayProps> = ({
    appName,
    provider,
    scopes,
    onAuth
}) => {
    return (
        <div className="orri-auth-container">
            <h2>{appName}</h2>
            <p>This app requires authentication to access your data.</p>
            <button
                className="orri-auth-button"
                onClick={() => onAuth(provider, scopes)}
            >
                Authenticate with {provider}
            </button>
        </div>
    );
};

// Use a wrapper to ensure this is a valid React component
const InternalDisplayRouter = (props: DisplayRouterProps): React.ReactElement => {
    const {
        loadingComponent = React.createElement('div', null, 'Loading...'),
        errorComponent: ErrorComponent,
        appName
    } = props;

    // Use React hooks to manage the current display state
    const [currentDisplay, setCurrentDisplay] = React.useState<DisplayEvent | null>(null);

    // Keep a reference to all registered tools
    const [tools, setTools] = React.useState<Map<string, OrriTool<any, any>>>(new Map());

    // Store app auth config
    const [authConfig, setAuthConfig] = React.useState<AuthConfig | null>(null);

    React.useEffect(() => {
        // Set up tools from the initialized app
        const appTools = orriCommunication.getRegisteredTools();
        console.log('Registered tools:', Array.from(appTools.keys()));
        if (appTools.size > 0) {
            setTools(appTools);
        }

        // Get auth config
        const config = orriCommunication.getAuthConfig();
        if (config) {
            setAuthConfig(config);
        }

        // Register listener for DISPLAY events from the host
        const handleDisplayEvent = (payload: DisplayEvent) => {
            console.log('Display event received:', payload);
            console.log('Available stages:', Object.values(DisplayStage));
            setCurrentDisplay(payload);
        };

        // Add event listener
        orriCommunication.addEventListener(EventType.DISPLAY, handleDisplayEvent);

        // Clean up on unmount
        return () => {
            orriCommunication.removeEventListener(EventType.DISPLAY, handleDisplayEvent);
        };
    }, []);

    // If no display is set yet, show the loading component
    if (!currentDisplay) {
        return React.createElement(React.Fragment, null, loadingComponent);
    }

    const { toolId, stage, input } = currentDisplay;
    console.log(`Looking for tool: ${toolId}, stage: ${stage}, input:`, input);
    console.log(`Stage: ${stage}, Expected preflight: ${DisplayStage.PREFLIGHT}`);

    // Helper function to check stage with more flexibility
    const isStage = (actual?: string, expected?: string) => {
        if (!actual || !expected) return false;
        return actual.toLowerCase() === expected.toLowerCase();
    };

    // Handle auth stage
    if (isStage(stage, DisplayStage.AUTH) || isStage(stage, 'auth')) {
        if (!authConfig) {
            if (ErrorComponent) {
                return React.createElement(ErrorComponent, {
                    displayId: 'auth',
                    stage
                });
            }
            return React.createElement(
                'div',
                { style: { padding: '1rem', color: 'red' } },
                `Error: Authentication configuration is not defined for this app`
            );
        }

        return React.createElement(AuthDisplay, {
            appName: appName || 'Orri App',
            provider: authConfig.provider,
            scopes: authConfig.scopes,
            onAuth: (provider, scopes) => {
                orriCommunication.sendUserAction(UserActionType.AUTH, {
                    provider,
                    scopes
                });
            }
        });
    }

    // Find the tool based on toolId
    const tool = tools.get(toolId);
    console.log('Found tool:', tool);

    // if (tool) {
    //     console.log('Tool has preflight:', !!tool.preflightDisplay);
    //     console.log('Tool has postflight:', !!tool.postflightDisplay);
    //     console.log('Preflight display type:', typeof tool.preflightDisplay);
    //     console.log('Preflight display value:', tool.preflightDisplay);
    // }

    if (!tool) {
        if (ErrorComponent) {
            return React.createElement(ErrorComponent, {
                displayId: 'unknown',
                toolId,
                stage
            });
        }
        return React.createElement(
            'div',
            { style: { padding: '1rem', color: 'red' } },
            `Error: Tool "${toolId}" not found`
        );
    }

    // Find the appropriate display component based on stage
    let DisplayComponent: React.ComponentType<any> | undefined;
    let displayProps = {};

    // Log the values to debug
    console.log('Looking for display with stage:', stage);
    console.log('DisplayStage.PREFLIGHT:', DisplayStage.PREFLIGHT);
    console.log('Stage comparison:', stage === DisplayStage.PREFLIGHT);

    if (isStage(stage, DisplayStage.PREFLIGHT) || isStage(stage, 'preflight')) {
        DisplayComponent = tool.preflightDisplay;
        console.log('Preflight component assigned:', DisplayComponent);

        if (!DisplayComponent) {
            console.error('Error: Preflight display component is null or undefined');
            if (ErrorComponent) {
                return React.createElement(ErrorComponent, {
                    displayId: 'preflight',
                    toolId,
                    stage
                });
            }
            return React.createElement(
                'div',
                { style: { padding: '1rem', color: 'red' } },
                `Error: Preflight display component is not defined for tool "${toolId}"`
            );
        }

        displayProps = {
            input: input || {},
            onInputChange: (newInput: any) => {
                // Send input change event to host
                orriCommunication.sendUserAction(UserActionType.INPUT_CHANGED, {
                    toolId: toolId,
                    input: newInput
                });
            },
            onSubmit: (finalInput: any) => {
                // Send confirm event to host with the final parameters
                orriCommunication.sendUserAction(UserActionType.CONFIRM, {
                    toolId: toolId,
                    input: finalInput
                });
            }
        };
    } else if (isStage(stage, DisplayStage.POSTFLIGHT) || isStage(stage, 'postflight')) {
        DisplayComponent = tool.postflightDisplay;
        console.log('Postflight component assigned:', DisplayComponent);

        if (!DisplayComponent) {
            console.error('Error: Postflight display component is null or undefined');
            if (ErrorComponent) {
                return React.createElement(ErrorComponent, {
                    displayId: 'postflight',
                    toolId,
                    stage
                });
            }
            return React.createElement(
                'div',
                { style: { padding: '1rem', color: 'red' } },
                `Error: Postflight display component is not defined for tool "${toolId}"`
            );
        }

        displayProps = {
            input: input || {}
        };
        console.log('Postflight display props:', displayProps);
    }

    console.log('Selected DisplayComponent:', DisplayComponent);

    // If the display component doesn't exist, show an error
    if (!DisplayComponent) {
        if (ErrorComponent) {
            return React.createElement(ErrorComponent, {
                displayId: 'unknown',
                toolId: toolId,
                stage
            });
        }
        return React.createElement(
            'div',
            { style: { padding: '1rem', color: 'red' } },
            `Error: No ${stage} display found for tool "${toolId}"`
        );
    }

    // Render the component with the appropriate props
    return React.createElement(DisplayComponent, displayProps);
};

/**
 * Display router component to be used in the micro-app
 * This will find and render the right display based on tool ID and stage
 */
export const DisplayRouter: React.FC<DisplayRouterProps> = (props) => {
    // Use regular React component syntax instead of createElement
    return React.createElement(InternalDisplayRouter, props);
}; 