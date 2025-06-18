import React from "react";

// Auth display component props
export interface AuthDisplayProps {
    appName: string;
    provider: string;
    scopes: string[];
    onAuth: (provider: string, scopes: string[]) => void;
}

// Modern, compact styling for the auth widget
const styles = {
    container: {
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        justifyContent: "center",
        padding: "1.25rem",
        maxWidth: "320px",
        margin: "0 auto",
        textAlign: "center" as const,
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        background: "linear-gradient(to bottom, #ffffff, #f9fafb)",
        border: "1px solid #eaeaea",
    },
    heading: {
        margin: "0 0 0.5rem",
        fontSize: "1.1rem",
        fontWeight: "bold",
        color: "#111827",
    },
    description: {
        margin: "0 0 1rem",
        color: "#6b7280",
        fontSize: "0.875rem",
        lineHeight: "1.4",
    },
    buttonContainer: {
        display: "flex",
        gap: "0.5rem",
        width: "100%",
    },
    primaryButton: {
        flex: "1.5",
        background: "linear-gradient(to right, #4f46e5, #6366f1)",
        color: "white",
        border: "none",
        borderRadius: "6px",
        padding: "0.6rem 0",
        fontSize: "0.875rem",
        cursor: "pointer",
        fontWeight: "500",
        transition: "all 0.2s ease",
        boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)",
    },
    secondaryButton: {
        flex: "1",
        background: "transparent",
        color: "#4b5563",
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        padding: "0.6rem 0",
        fontSize: "0.875rem",
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    hoverStyles: {
        primaryHover: {
            transform: "translateY(-1px)",
            boxShadow: "0 4px 6px rgba(79, 70, 229, 0.25)",
        },
        secondaryHover: {
            backgroundColor: "#f9fafb",
            borderColor: "#d1d5db",
        },
    },
};

/**
 * A compact, modern authentication widget
 */
export const AuthDisplay: React.FC<AuthDisplayProps> = ({
    appName,
    provider,
    scopes,
    onAuth
}) => {
    const [primaryHover, setPrimaryHover] = React.useState(false);

    const handleAuthRequest = () => {
        onAuth(provider, scopes);
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                padding: "1.5rem 1rem",
                height: "100%",
            }}
        >
            <h2
                style={{
                    margin: "0 0 0.75rem",
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    color: "#1f2937",
                }}
            >
                {appName}
            </h2>

            <p
                style={{
                    margin: "0 0 1.5rem",
                    color: "#6b7280",
                    fontSize: "0.9rem",
                    lineHeight: "1.4",
                    maxWidth: "90%",
                }}
            >
                This app requires authentication to access your data.
            </p>

            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    width: "100%",
                    maxWidth: "280px",
                }}
            >
                <button
                    onClick={handleAuthRequest}
                    style={{
                        background: "#5850EC",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        padding: "0.75rem 2rem",
                        fontSize: "0.95rem",
                        fontWeight: "500",
                        cursor: "pointer",
                        boxShadow: "0 2px 4px rgba(88, 80, 236, 0.25)",
                        transition: "all 0.2s ease",
                        ...(primaryHover
                            ? {
                                background: "#4338CA",
                                boxShadow: "0 4px 6px rgba(88, 80, 236, 0.3)",
                            }
                            : {}),
                    }}
                    onMouseEnter={() => setPrimaryHover(true)}
                    onMouseLeave={() => setPrimaryHover(false)}
                >
                    Authenticate with {provider}
                </button>
            </div>
        </div>
    );
}; 