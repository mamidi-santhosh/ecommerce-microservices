import React from 'react';
import { CheckCircle2, AlertTriangle, RefreshCw, X, ShieldAlert, ArrowRight, Database, Lock, Mail, Cpu } from 'lucide-react';

export default function SagaVisualizerModal({ orderResponse, onClose }) {
  if (!orderResponse) return null;

  const isCancelled = orderResponse.status?.startsWith('CANCELLED');
  const isConfirmed = orderResponse.status === 'CONFIRMED';
  const logs = orderResponse.sagaAuditLogs || [];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '24px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '850px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '32px',
        position: 'relative',
        border: isCancelled ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: '#fff',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={20} />
        </button>

        {/* Status Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: isCancelled ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isCancelled ? 'var(--glow-rose)' : 'var(--glow-emerald)'
          }}>
            {isCancelled ? (
              <AlertTriangle size={32} color="#f43f5e" />
            ) : (
              <CheckCircle2 size={32} color="#10b981" />
            )}
          </div>
          <div>
            <span className={isCancelled ? "badge badge-rose" : "badge badge-emerald"} style={{ marginBottom: '6px' }}>
              SAGA STATE MACHINE RESULT
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              Order {orderResponse.orderId}: {orderResponse.status}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              SKU: {orderResponse.sku} • Qty: {orderResponse.quantity} • Total: ${orderResponse.totalAmount}
            </p>
          </div>
        </div>

        {/* Failure banner if cancelled */}
        {isCancelled && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            color: '#fda4af'
          }}>
            <h4 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <ShieldAlert size={18} /> Saga Compensation Execution Triggered
            </h4>
            <p style={{ fontSize: '0.875rem' }}>
              Reason: {orderResponse.failureReason || 'Distributed transaction step failed.'}
            </p>
          </div>
        )}

        {/* Step-by-Step Saga Flow Diagram */}
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={18} color="var(--accent-purple)" /> Saga Orchestration Audit Steps
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
          {logs.map((log, idx) => {
            const isCompensated = log.status === 'COMPENSATED';
            const isFailed = log.status === 'FAILED';
            const isCompleted = log.status === 'COMPLETED';

            return (
              <div key={idx} style={{
                background: isCompensated
                  ? 'rgba(245, 158, 11, 0.1)'
                  : isFailed
                  ? 'rgba(244, 63, 94, 0.1)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: isCompensated
                  ? '1px solid rgba(245, 158, 11, 0.3)'
                  : isFailed
                  ? '1px solid rgba(244, 63, 94, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isCompensated
                      ? 'rgba(245, 158, 11, 0.2)'
                      : isFailed
                      ? 'rgba(244, 63, 94, 0.2)'
                      : 'rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: isCompensated ? '#fde68a' : isFailed ? '#fda4af' : '#6ee7b7'
                  }}>
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="code-font" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                        {log.stepName}
                      </span>
                      <span className={
                        isCompensated ? "badge badge-amber" : isFailed ? "badge badge-rose" : "badge badge-emerald"
                      }>
                        {log.status}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginTop: '2px' }}>
                      {log.details}
                    </p>
                  </div>
                </div>

                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'NOW'}
                </span>
              </div>
            );
          })}
        </div>

        <button className="btn-primary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>
          Close Visualizer
        </button>
      </div>
    </div>
  );
}
