import React from 'react';
import { ShoppingBag, Server, Activity, ShieldCheck, Zap } from 'lucide-react';

export default function Header({ cartCount, onOpenCart, activeTab, setActiveTab, serviceStatus }) {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '14px 28px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('store')}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)'
          }}>
            <Zap size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              NEXUS <span className="gradient-text">E-COMMERCE</span>
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Saga Orchestrator • Spring Boot 3 Microservices
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('store')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'store' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
              color: activeTab === 'store' ? '#c4b5fd' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <ShoppingBag size={16} /> Storefront
          </button>

          <button
            onClick={() => setActiveTab('system-design')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: activeTab === 'system-design' ? '1px solid rgba(6, 182, 212, 0.4)' : 'none',
              background: activeTab === 'system-design' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              color: activeTab === 'system-design' ? '#67e8f9' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Server size={16} /> System Design Dashboard (10 Concepts)
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'orders' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: activeTab === 'orders' ? '#6ee7b7' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Activity size={16} /> Order & Saga History
          </button>
        </nav>

        {/* Microservice Health Indicators & Cart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '6px 12px',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            fontSize: '0.8rem'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: serviceStatus ? '#10b981' : '#f43f5e', display: 'inline-block' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Eureka Discovery:</span>
            <span className="code-font" style={{ color: serviceStatus ? '#6ee7b7' : '#fda4af', fontWeight: 600 }}>
              {serviceStatus ? 'CONNECTED (5 Services)' : 'OFFLINE (Fallback Mode)'}
            </span>
          </div>

          <button className="btn-primary" onClick={onOpenCart} style={{ position: 'relative' }}>
            <ShoppingBag size={18} />
            <span>Cart</span>
            {cartCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                background: 'var(--accent-rose)',
                color: '#fff',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700
              }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
