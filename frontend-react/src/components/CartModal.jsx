import React, { useState } from 'react';
import { ShoppingBag, X, Trash2, Zap, ShieldAlert, CreditCard } from 'lucide-react';

export default function CartModal({ cart, onClose, onUpdateQty, onRemoveItem, onCheckout, simulateFailure, setSimulateFailure }) {
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
      justifyContent: 'flex-end',
      zIndex: 1000
    }}>
      <div className="glass-panel" style={{
        maxWidth: '480px',
        width: '100%',
        height: '100vh',
        borderRadius: '0',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderLeft: '1px solid var(--border-color)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShoppingBag size={22} color="var(--accent-purple)" /> Shopping Cart
            </h2>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
          </div>

          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <ShoppingBag size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p>Your cart is empty.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '50vh', overflowY: 'auto', paddingRight: '8px' }}>
              {cart.map((item) => (
                <div key={item.id} style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <img src={item.imageUrl} alt={item.name} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{item.name}</h4>
                    <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 700 }}>${item.price}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => onUpdateQty(item.id, item.quantity - 1)} className="btn-secondary" style={{ padding: '4px 8px' }}>-</button>
                    <span className="code-font" style={{ fontWeight: 700 }}>{item.quantity}</span>
                    <button onClick={() => onUpdateQty(item.id, item.quantity + 1)} className="btn-secondary" style={{ padding: '4px 8px' }}>+</button>
                    <button onClick={() => onRemoveItem(item.id)} style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', marginLeft: '4px' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div>
            {/* Simulation Toggle */}
            <div style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '20px'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.85rem', color: '#fda4af' }}>
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  style={{ accentColor: '#f43f5e', width: '18px', height: '18px' }}
                />
                <span style={{ fontWeight: 600 }}>Simulate Payment Failure & Circuit Breaker Trip</span>
              </label>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', paddingLeft: '28px' }}>
                Triggers Saga Compensation step to restore inventory stock.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>TOTAL</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>${totalAmount.toFixed(2)}</span>
            </div>

            <button className="btn-primary" onClick={onCheckout} style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}>
              <Zap size={18} /> Execute Saga Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
