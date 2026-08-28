import React from 'react';
import { Activity, Eye, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

export default function OrderHistory({ orders, onViewSagaLogs }) {
  return (
    <div style={{ maxWidth: '1400px', margin: '32px auto', padding: '0 24px' }}>
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={24} color="var(--accent-emerald)" /> Order History & Saga Audit Logs
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
          Inspect completed and compensated orders processed by the Order Service Saga Orchestrator.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Activity size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p>No orders placed yet. Place an order from the Storefront to view live Saga execution logs.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.map((order) => {
            const isCancelled = order.status?.startsWith('CANCELLED');
            return (
              <div key={order.orderId} className="glass-panel" style={{
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                borderLeft: isCancelled ? '4px solid #f43f5e' : '4px solid #10b981'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span className="code-font" style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                      {order.orderId}
                    </span>
                    <span className={isCancelled ? "badge badge-rose" : "badge badge-emerald"}>
                      {order.status}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    SKU: <strong>{order.sku}</strong> • Qty: {order.quantity} • Total: <strong>${order.totalAmount}</strong> • {new Date(order.createdAt).toLocaleString()}
                  </p>
                  {order.failureReason && (
                    <p style={{ color: '#fda4af', fontSize: '0.8rem', marginTop: '4px' }}>
                      Reason: {order.failureReason}
                    </p>
                  )}
                </div>

                <button className="btn-secondary" onClick={() => onViewSagaLogs(order)}>
                  <Eye size={16} /> View Saga Timeline
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
