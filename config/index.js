/**
 * Configuration module
 * Centralizes all environment variables and configuration settings
 */

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    wsPort: process.env.WS_PORT || 8080,
  },

  // Database configuration
  database: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "orders_db",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "raunak@1234",
  },

  // WebSocket configuration
  websocket: {
    reconnectDelay: 5000,
    maxReconnectAttempts: 5,
  },

  // Database notification channels
  channels: {
    ordersChanges: "orders_changes",
  },
};

module.exports = config;

