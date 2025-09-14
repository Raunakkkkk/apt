import React from "react";

const OrderCard = ({ order, onUpdateStatus, onDelete, className = "" }) => {
  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      pending: "shipped",
      shipped: "delivered",
      delivered: "pending",
    };
    return statusFlow[currentStatus] || "pending";
  };

  return (
    <div className={`order-card ${className}`}>
      <div className="order-id">Order #{order.id}</div>
      <div className="order-details">
        <div>
          <strong>Customer:</strong> {order.customer_name}
        </div>
        <div>
          <strong>Product:</strong> {order.product_name}
        </div>
        <div>
          <strong>Updated:</strong>{" "}
          {new Date(order.updated_at).toLocaleString()}
        </div>
      </div>
      <div className={`order-status status-${order.status}`}>
        {order.status}
      </div>
      <div className="order-actions">
        <button
          className="btn btn-sm btn-success"
          onClick={() => onUpdateStatus(order.id, getNextStatus(order.status))}
        >
          Mark as {getNextStatus(order.status)}
        </button>
        <button
          className="btn btn-sm btn-danger"
          onClick={() => onDelete(order.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default OrderCard;

