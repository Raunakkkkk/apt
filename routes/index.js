/**
 * Routes index module
 * Centralizes all route modules
 */

const express = require("express");
const ordersRoutes = require("./orders");

const router = express.Router();

// Mount orders routes
router.use("/orders", ordersRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0",
  });
});

// API info endpoint
router.get("/", (req, res) => {
  res.json({
    message: "Real-Time Orders API",
    version: "1.0.0",
    endpoints: {
      orders: "/api/orders",
      health: "/api/health",
    },
    documentation: "See README.md for full API documentation",
  });
});

module.exports = router;

