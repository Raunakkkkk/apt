import React from "react";

const SocketMessages = ({ messages }) => {
  return (
    <div className="socket-messages-section">
      <div className="section-title">🔌 WebSocket Messages</div>
      <div className="socket-messages-log">
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "#6b7280" }}>
            No WebSocket messages yet...
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className="socket-message-item">
              <div className="socket-message-time">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
              <div className="socket-message-type">
                Type: <span className="message-type">{message.type}</span>
              </div>
              <pre className="socket-message-content">
                {JSON.stringify(message.data, null, 2)}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SocketMessages;

