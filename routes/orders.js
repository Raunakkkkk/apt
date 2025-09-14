/**
 * Orders routes module
 * Handles all API endpoints related to orders
 */

const express = require("express");
const database = require("../database");

const router = express.Router();

/**
 * GET /api/orders - Get all orders
 */
router.get("/", async (req, res) => {
  try {
    const orders = await database.getAllOrders();
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      error: "Failed to fetch orders",
      details: error.message,
    });
  }
});

/**
 * POST /api/orders - Create a new order
 */
router.post("/", async (req, res) => {
  try {
    const { customer_name, product_name, status = "pending" } = req.body;

    // Validation
    if (!customer_name || !product_name) {
      return res.status(400).json({
        error: "customer_name and product_name are required",
      });
    }

    // Validate status
    const validStatuses = ["pending", "shipped", "delivered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be one of: " + validStatuses.join(", "),
      });
    }

    const order = await database.createOrder(
      customer_name,
      product_name,
      status
    );
    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      error: "Failed to create order",
      details: error.message,
    });
  }
});

/**
 * PUT /api/orders/:id - Update an existing order
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_name, product_name, status } = req.body;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        error: "Invalid order ID",
      });
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ["pending", "shipped", "delivered"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: "Invalid status. Must be one of: " + validStatuses.join(", "),
        });
      }
    }

    const updates = { customer_name, product_name, status };
    const updatedOrder = await database.updateOrder(id, updates);

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({
      error: "Failed to update order",
      details: error.message,
    });
  }
});

/**
 * DELETE /api/orders/:id - Delete an order
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        error: "Invalid order ID",
      });
    }

    const deletedOrder = await database.deleteOrder(id);

    if (!deletedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({
      message: "Order deleted successfully",
      order: deletedOrder,
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({
      error: "Failed to delete order",
      details: error.message,
    });
  }
});

/**
 * GET /api/orders/:id - Get a specific order
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        error: "Invalid order ID",
      });
    }

    const result = await database.query("SELECT * FROM orders WHERE id = $1", [
      id,
    ]);
    const order = result.rows[0];

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      error: "Failed to fetch order",
      details: error.message,
    });
  }
});

/**
 * GET /api/orders/status/:status - Get orders by status
 */
router.get("/status/:status", async (req, res) => {
  try {
    const { status } = req.params;

    // Validate status
    const validStatuses = ["pending", "shipped", "delivered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be one of: " + validStatuses.join(", "),
      });
    }

    const result = await database.query(
      "SELECT * FROM orders WHERE status = $1 ORDER BY updated_at DESC",
      [status]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching orders by status:", error);
    res.status(500).json({
      error: "Failed to fetch orders by status",
      details: error.message,
    });
  }
});

module.exports = router;

