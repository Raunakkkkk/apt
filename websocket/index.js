/**
 * WebSocket service module
 * Manages WebSocket connections and real-time broadcasting
 */

const WebSocket = require("ws");
const config = require("../config");

let wss = null;
const clients = new Set();
let heartbeatInterval = null;

/**
 * Initialize WebSocket server
 */
function init() {
  wss = new WebSocket.Server({
    port: config.server.wsPort,
    perMessageDeflate: false,
  });

  wss.on("connection", (ws, req) => {
    clients.add(ws);

    // Send welcome message
    ws.send(
      JSON.stringify({
        type: "connection",
        message: "Connected to Real-Time Orders System",
        timestamp: Date.now(),
      })
    );

    // Handle client messages
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);

        // Echo back for now (can be extended)
        ws.send(
          JSON.stringify({
            type: "echo",
            data: data,
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        console.error("❌ Error parsing client message:", error);
      }
    });

    // Handle client disconnect
    ws.on("close", () => {
      clients.delete(ws);
    });

    // Handle WebSocket errors
    ws.on("error", (error) => {
      console.error("❌ WebSocket error:", error);
      clients.delete(ws);
    });
  });

  wss.on("error", (error) => {
    console.error("❌ WebSocket Server error:", error);
  });
}

/**
 * Broadcast database changes to all connected clients
 */
function broadcastDatabaseChange(channel, payload) {
  if (clients.size === 0) {
    return;
  }

  const message = JSON.stringify({
    type: "database_change",
    channel: channel,
    data: payload,
    timestamp: Date.now(),
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (error) {
        console.error("❌ Error sending to client:", error);
        clients.delete(client);
      }
    } else {
      clients.delete(client);
    }
  });
}

/**
 * Start heartbeat to keep connections alive
 */
function startHeartbeat() {
  heartbeatInterval = setInterval(() => {
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.ping();
        } catch (error) {
          console.error("❌ Error pinging client:", error);
          clients.delete(client);
        }
      } else {
        clients.delete(client);
      }
    });
  }, 30000); // Every 30 seconds
}

/**
 * Close WebSocket server and all connections
 */
async function close() {
  return new Promise((resolve) => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }

    if (wss) {
      // Close all client connections
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.close(1000, "Server shutdown");
        }
      });
      clients.clear();

      // Close the server
      wss.close(() => {
        resolve();
      });
    } else {
      resolve();
    }
  });
}

/**
 * Get current connection stats
 */
function getStats() {
  return {
    totalClients: clients.size,
    serverRunning: wss !== null,
    port: config.server.wsPort,
  };
}

module.exports = {
  init,
  broadcastDatabaseChange,
  startHeartbeat,
  close,
  getStats,
};
