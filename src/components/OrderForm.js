import React, { useState } from "react";

const OrderForm = ({ onCreateOrder }) => {
  const [customerName, setCustomerName] = useState("");
  const [productName, setProductName] = useState("");
  const [status, setStatus] = useState("pending");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerName.trim() || !productName.trim()) {
      alert("Please fill in all fields");
      return;
    }

    onCreateOrder({
      customer_name: customerName.trim(),
      product_name: productName.trim(),
      status,
    });

    // Reset form
    setCustomerName("");
    setProductName("");
    setStatus("pending");
  };

  return (
    <div className="form-section">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="customerName">Customer Name</label>
            <input
              type="text"
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="productName">Product Name</label>
            <input
              type="text"
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Enter product name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">
            Create Order
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;

