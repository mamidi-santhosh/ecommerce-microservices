import React from 'react';
import { ShoppingCart, Zap, CheckCircle2, ShieldCheck, Database } from 'lucide-react';

export default function ProductCatalog({ products, onAddToCart, onBuyNow, isCacheHit, onRefreshProducts }) {
  return (
    <div style={{ maxWidth: '1400px', margin: '32px auto', padding: '0 24px' }}>
      {/* Banner */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#67e8f9', borderRadius: '20px', padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '10px' }}>
            <Database size={14} /> @Cacheable (Spring Cache + Redis)
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Production Storefront</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
            Browse inventory catalog cached in Redis. Select any product to initiate a real-time Saga Orchestration transaction.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="badge badge-purple" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            <Zap size={14} /> Redis Cache Status: {isCacheHit ? 'CACHE HIT (Redis 60s TTL)' : 'CACHE EVECTED / FETCH DB'}
          </div>
          <button className="btn-secondary" onClick={onRefreshProducts}>
            Refresh Catalog
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {products.map((product) => (
          <div key={product.id} className="glass-panel" style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div>
              {/* Image Container */}
              <div style={{
                height: '200px',
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '16px',
                position: 'relative',
                background: 'rgba(0,0,0,0.3)'
              }}>
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span className="badge badge-cyan" style={{ position: 'absolute', top: '10px', left: '10px' }}>
                  {product.category}
                </span>
                <span className="badge badge-purple" style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
                  SKU: {product.sku}
                </span>
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>
                {product.name}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4', marginBottom: '16px', height: '40px', overflow: 'hidden' }}>
                {product.description}
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>PRICE</span>
                  <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8' }}>
                    ${product.price}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>STOCK</span>
                  <span className="code-font" style={{
                    fontWeight: 700,
                    color: product.stockQuantity > 10 ? '#6ee7b7' : product.stockQuantity > 0 ? '#fde68a' : '#fda4af'
                  }}>
                    {product.stockQuantity > 0 ? `${product.stockQuantity} UNITS` : 'OUT OF STOCK'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  className="btn-secondary"
                  onClick={() => onAddToCart(product)}
                  disabled={product.stockQuantity <= 0}
                  style={{ justifyContent: 'center', fontSize: '0.85rem' }}
                >
                  <ShoppingCart size={15} /> Add to Cart
                </button>
                <button
                  className="btn-primary"
                  onClick={() => onBuyNow(product)}
                  disabled={product.stockQuantity <= 0}
                  style={{ justifyContent: 'center', fontSize: '0.85rem' }}
                >
                  <Zap size={15} /> Buy (Saga)
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
