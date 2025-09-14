import React from "react";

const ActivityLog = ({ activities }) => {
  return (
    <div className="activity-section">
      <div className="section-title">📊 Activity Log</div>
      <div className="activity-log">
        {activities.length === 0 ? (
          <div style={{ textAlign: "center", color: "#6b7280" }}>
            Waiting for real-time updates...
          </div>
        ) : (
          activities.map((activity, index) => (
            <div key={index} className="activity-item">
              <div className="activity-time">{activity.time}</div>
              <div>{activity.message}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityLog;

