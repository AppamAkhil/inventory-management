import React from 'react';

export default function InventoryHistoryPanel({ product, history, onClose }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div>
          <div style={{ fontWeight: 600 }}>Inventory History</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{product?.name}</div>
        </div>
        <button className="button" onClick={onClose}>Close</button>
      </div>
      <div className="sidebar-body">
        <table className="table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Old</th>
              <th>New</th>
              <th>Changed By</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr><td className="empty" colSpan="5">No history</td></tr>
            )}
            {history.map((h, i) => (
              <tr key={i}>
                <td>{new Date(h.timestamp).toLocaleDateString()}</td>
                <td>{h.oldStock}</td>
                <td>{h.newStock}</td>
                <td>{h.changedBy}</td>
                <td>{new Date(h.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}