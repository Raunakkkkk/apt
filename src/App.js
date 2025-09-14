import React, { useState, useEffect } from "react";
import useWebSocket from "./hooks/useWebSocket";
import OrderForm from "./components/OrderForm";
import OrderCard from "./components/OrderCard";
import ActivityLog from "./components/ActivityLog";
import SocketMessages from "./components/SocketMessages";

const App = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [orderAnimations, setOrderAnimations] = useState({});
  const [socketMessages, setSocketMessages] = useState([]);

  const wsUrl = `ws://${window.location.hostname}:8080`;
  const { isConnected, lastMessage } = useWebSocket(wsUrl);

  // Load initial orders
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/orders");
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error("Error loading orders:", error);
        addActivity(`Error loading orders: ${error.message}`, "error");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    // Add ALL messages to socket messages log
    const socketMessage = {
      timestamp: Date.now(),
      type: lastMessage.type,
      data: lastMessage
    };
    setSocketMessages(prev => [socketMessage, ...prev.slice(0, 19)]);

    if (lastMessage.type === "database_change") {
      handleDatabaseChange(lastMessage);
    } else if (lastMessage.type === "connection") {
      addActivity(lastMessage.message, "info");
    }
  }, [lastMessage]);

  const addActivity = (message, type) => {
    const newActivity = {
      time: new Date().toLocaleTimeString(),
      message,
      type,
    };
    setActivities((prev) => [newActivity, ...prev.slice(0, 19)]);
  };

  const handleDatabaseChange = (message) => {
    const { operation, data: orderData } = message.data;

    addActivity(
      `${operation}: Order #${orderData.id} - ${orderData.customer_name}`,
      operation.toLowerCase()
    );

    switch (operation) {
      case "INSERT":
        setOrders((prev) => [orderData, ...prev]);
        setOrderAnimations((prev) => ({ ...prev, [orderData.id]: "new" }));
        setTimeout(() => {
          setOrderAnimations((prev) => {
            const newState = { ...prev };
            delete newState[orderData.id];
            return newState;
          });
        }, 1000);
        break;

      case "UPDATE":
        setOrders((prev) =>
          prev.map((order) => (order.id === orderData.id ? orderData : order))
        );
        setOrderAnimations((prev) => ({ ...prev, [orderData.id]: "updated" }));
        setTimeout(() => {
          setOrderAnimations((prev) => {
            const newState = { ...prev };
            delete newState[orderData.id];
            return newState;
          });
        }, 1000);
        break;

      case "DELETE":
        setOrderAnimations((prev) => ({ ...prev, [orderData.id]: "deleted" }));
        setTimeout(() => {
          setOrders((prev) =>
            prev.filter((order) => order.id !== orderData.id)
          );
          setOrderAnimations((prev) => {
            const newState = { ...prev };
            delete newState[orderData.id];
            return newState;
          });
        }, 500);
        break;
    }
  };

  const createOrder = async (orderData) => {
    try {
      const response = await fetch("http://localhost:3000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        alert("Error creating order: " + error.error);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Error creating order: " + error.message);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/orders/${orderId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        alert("Error updating order: " + error.error);
      }
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Error updating order: " + error.message);
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/orders/${orderId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        alert("Error deleting order: " + error.error);
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Error deleting order: " + error.message);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>🚀 Real-Time Orders Dashboard</h1>
        <p>Live updates powered by PostgreSQL NOTIFY/LISTEN and WebSockets</p>
        <div className={`status ${isConnected ? "connected" : "disconnected"}`}>
          {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
        </div>
      </div>

      <OrderForm onCreateOrder={createOrder} />

      <div className="orders-section">
        <div className="section-title">📦 Live Orders ({orders.length})</div>

        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div
            style={{ textAlign: "center", color: "#6b7280", padding: "40px" }}
          >
            No orders found. Create your first order above!
          </div>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                className={orderAnimations[order.id] || ""}
                onUpdateStatus={updateOrderStatus}
                onDelete={deleteOrder}
              />
            ))}
          </div>
        )}
      </div>

      <ActivityLog activities={activities} />
      
      <SocketMessages messages={socketMessages} />
    </div>
  );
};

export default App;
