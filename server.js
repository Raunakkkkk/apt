/**
 * Main server file
 * Orchestrates all modules and starts the application
 */

const express = require("express");
const config = require("./config");
const database = require("./database");
const websocketService = require("./websocket");
const apiRoutes = require("./routes");

// Create Express app
const app = express();

// Middleware
app.use(express.json());

// CORS for frontend development
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3001");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// API routes
app.use("/api", apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    path: req.originalUrl,
  });
});

/**
 * Initialize all services
 */
async function initializeServices() {
  try {
    console.log("🚀 Starting Real-Time Orders System...");

    // Test database connection
    console.log("📊 Testing database connection...");
    const dbConnected = await database.testConnection();
    if (!dbConnected) {
      console.warn(
        "⚠️ Database connection failed - running without database features"
      );
      console.log("🔌 Initializing WebSocket service...");
      websocketService.init();
      websocketService.startHeartbeat();
      console.log("✅ Services initialized (database disabled)");
      return;
    }

    // Setup database listener
    console.log("👂 Setting up database listener...");
    await database.setupListener();

    // Initialize WebSocket service
    console.log("🔌 Initializing WebSocket service...");
    websocketService.init();

    // Start periodic heartbeat
    websocketService.startHeartbeat();

    // Connect database notifications to WebSocket broadcasts
    database.onNotification((channel, payload) => {
      websocketService.broadcastDatabaseChange(channel, payload);
    });

    console.log("✅ All services initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize services:", error);
    process.exit(1);
  }
}

/**
 * Start HTTP server
 */
function startHttpServer() {
  const server = app.listen(config.server.port, () => {
    console.log(
      `🌐 HTTP Server running on http://localhost:${config.server.port}`
    );
  });

  server.on("error", (error) => {
    console.error("HTTP Server error:", error);
    process.exit(1);
  });

  return server;
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal) {
  console.log(`\n📴 Received ${signal}. Starting graceful shutdown...`);

  try {
    // Close WebSocket server
    console.log("🔌 Closing WebSocket connections...");
    await websocketService.close();

    // Close database listener
    console.log("📊 Closing database connections...");
    await database.closeListener();

    console.log("✅ Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("unhandledRejection");
});

// Initialize and start the application
async function start() {
  await initializeServices();
  startHttpServer();

  console.log("🎉 Real-Time Orders System is ready!");
  console.log(
    `📱 Open http://localhost:${config.server.port} to view the dashboard`
  );
}

// Start the application
start().catch((error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});
