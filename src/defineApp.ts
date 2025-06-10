import { OrriApp } from './types';
import { orriCommunication } from './communication';

/**
 * Define an Orri application
 */
export function defineApp(config: OrriApp): OrriApp & { initialize: () => void } {
    // Add initialize method to the app
    return {
        ...config,
        initialize: () => {
            // Initialize communication with host
            orriCommunication.initialize(config);

            console.log(`Orri app '${config.name}' initialized with ${config.tools.length} tools`);
        }
    };
} 