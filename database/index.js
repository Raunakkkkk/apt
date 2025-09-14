/**
 * Database module
 * Handles PostgreSQL connections, queries, and LISTEN/NOTIFY functionality
 */

const { Client } = require("pg");
const config = require("../config");

class DatabaseService {
  constructor() {
    this.dbConfig = config.database;
    this.listenClient = null;
    this.eventHandlers = new Map();
  }

  /**
   * Create a new database client for one-time operations
   */
  createClient() {
    return new Client(this.dbConfig);
  }

  /**
   * Execute a query with automatic connection management
   */
  async query(text, params = []) {
    const client = this.createClient();
    try {
      await client.connect();
      const result = await client.query(text, params);
      return result;
    } finally {
      await client.end();
    }
  }

  /**
   * Get all orders
   */
  async getAllOrders() {
    const result = await this.query(
      "SELECT * FROM orders ORDER BY updated_at DESC"
    );
    return result.rows;
  }

  /**
   * Create a new order
   */
  async createOrder(customerName, productName, status = "pending") {
    const result = await this.query(
      "INSERT INTO orders (customer_name, product_name, status) VALUES ($1, $2, $3) RETURNING *",
      [customerName, productName, status]
    );
    return result.rows[0];
  }

  /**
   * Update an existing order
   */
  async updateOrder(id, updates) {
    const { customer_name, product_name, status } = updates;
    const result = await this.query(
      "UPDATE orders SET customer_name = COALESCE($1, customer_name), product_name = COALESCE($2, product_name), status = COALESCE($3, status) WHERE id = $4 RETURNING *",
      [customer_name, product_name, status, id]
    );
    return result.rows[0];
  }

  /**
   * Delete an order
   */
  async deleteOrder(id) {
    const result = await this.query(
      "DELETE FROM orders WHERE id = $1 RETURNING *",
      [id]
    );
    return result.rows[0];
  }

  /**
   * Setup LISTEN client for database notifications
   */
  async setupListener() {
    if (this.listenClient) {
      return;
    }

    try {
      this.listenClient = new Client(this.dbConfig);
      await this.listenClient.connect();

      // Listen to orders_changes channel
      await this.listenClient.query(`LISTEN ${config.channels.ordersChanges}`);

      // Handle notifications
      this.listenClient.on("notification", (msg) => {
        try {
          const payload = JSON.parse(msg.payload);

          // Emit to all registered handlers
          this.eventHandlers.forEach((handler) => {
            handler(msg.channel, payload);
          });
        } catch (error) {
          console.error("Error processing notification:", error);
        }
      });

      // Handle connection errors
      this.listenClient.on("error", (error) => {
        console.error("PostgreSQL LISTEN client error:", error);
        this.handleConnectionError();
      });

      // Handle connection end
      this.listenClient.on("end", () => {
        this.handleConnectionError();
      });
    } catch (error) {
      console.error("Failed to setup database listener:", error);
      this.handleConnectionError();
    }
  }

  /**
   * Handle connection errors with reconnection logic
   */
  handleConnectionError() {
    if (this.listenClient) {
      this.listenClient.removeAllListeners();
      this.listenClient = null;
    }

    // Attempt to reconnect after a delay
    setTimeout(() => {
      this.setupListener();
    }, config.websocket.reconnectDelay);
  }

  /**
   * Register a handler for database notifications
   */
  onNotification(handler) {
    const handlerId = Symbol("handler");
    this.eventHandlers.set(handlerId, handler);

    // Return unsubscribe function
    return () => {
      this.eventHandlers.delete(handlerId);
    };
  }

  /**
   * Close the listen client connection
   */
  async closeListener() {
    if (this.listenClient) {
      try {
        await this.listenClient.end();
      } catch (error) {
        console.error("Error closing database listener:", error);
      } finally {
        this.listenClient = null;
        this.eventHandlers.clear();
      }
    }
  }

  /**
   * Test database connection
   */
  async testConnection() {
    try {
      const result = await this.query("SELECT NOW() as current_time");
      return true;
    } catch (error) {
      console.error("Database connection test failed:", error);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new DatabaseService();
