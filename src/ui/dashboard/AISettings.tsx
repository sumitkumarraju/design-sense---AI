import React, { useState } from "react";

interface AISettingsProps {
    isConnected: boolean;
    onConnect: (clientId: string, clientSecret: string) => void;
    onDisconnect: () => void;
    connectionStatus: string;
}

export const AISettings: React.FC<AISettingsProps> = ({
    isConnected,
    onConnect,
    onDisconnect,
    connectionStatus
}) => {
    const [clientId, setClientId] = useState("");
    const [clientSecret, setClientSecret] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);

    const handleConnect = () => {
        if (clientId.trim() && clientSecret.trim()) {
            onConnect(clientId.trim(), clientSecret.trim());
        }
    };

    return (
        <div className="ai-settings">
            <button
                className="ai-settings-toggle"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className={`ai-status-dot ${isConnected ? "connected" : "disconnected"}`} />
                <span>Adobe Firefly AI</span>
                <span className="ai-toggle-icon">{isExpanded ? "▲" : "▼"}</span>
            </button>

            {isExpanded && (
                <div className="ai-settings-panel">
                    {!isConnected ? (
                        <>
                            <div className="ai-field">
                                <label>Client ID</label>
                                <input
                                    type="text"
                                    value={clientId}
                                    onChange={e => setClientId(e.target.value)}
                                    placeholder="From Adobe Developer Console"
                                />
                            </div>
                            <div className="ai-field">
                                <label>Client Secret</label>
                                <input
                                    type="password"
                                    value={clientSecret}
                                    onChange={e => setClientSecret(e.target.value)}
                                    placeholder="••••••••••"
                                />
                            </div>
                            <button
                                className="action-btn primary"
                                onClick={handleConnect}
                                disabled={!clientId.trim() || !clientSecret.trim()}
                            >
                                🔗 Connect to Firefly
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="ai-connected-info">
                                <span className="ai-status-dot connected" />
                                <span>Connected to Adobe Firefly</span>
                            </div>
                            <button
                                className="action-btn secondary"
                                onClick={onDisconnect}
                            >
                                Disconnect
                            </button>
                        </>
                    )}
                    {connectionStatus && (
                        <div className={`ai-status-msg ${isConnected ? "success" : "error"}`}>
                            {connectionStatus}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
