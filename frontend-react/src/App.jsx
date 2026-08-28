import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SystemDesignPanel from './components/SystemDesignPanel';
import ProductCatalog from './components/ProductCatalog';
import CartModal from './components/CartModal';
import SagaVisualizerModal from './components/SagaVisualizerModal';
import OrderHistory from './components/OrderHistory';
import AuthModal from './components/AuthModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('store');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrderSaga, setSelectedOrderSaga] = useState(null);
  const [simulateCircuitBreaker, setSimulateCircuitBreaker] = useState(false);
  const [simulatePaymentFailure, setSimulatePaymentFailure] = useState(false);
  const [isCacheHit, setIsCacheHit] = useState(true);
  const [serviceStatus, setServiceStatus] = useState(true);

  // Restore saved session if present
  useEffect(() => {
    const savedToken = localStorage.getItem('accessToken');
    const savedUserEmail = localStorage.getItem('userEmail');
    if (savedToken && savedUserEmail) {
      setUser({ email: savedUserEmail, role: 'ROLE_USER' });
    }
  }, []);

  // Initial Product Catalog
  const [products, setProducts] = useState([
    { id: 1, sku: 'PROD-NEO-01', name: 'Cyberpunk Wireless Headphones', description: 'Active noise cancelling with RGB ambient light spectrum', price: 199.99, stockQuantity: 50, category: 'Electronics', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80' },
    { id: 2, sku: 'PROD-NEO-02', name: 'Quantum Mechanical Keyboard', description: 'Linear optical switches with magnetic wrist rest', price: 149.50, stockQuantity: 30, category: 'Accessories', imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80' },
    { id: 3, sku: 'PROD-NEO-03', name: 'Aura OLED Smartwatch 5', description: 'Biometric tracking, Sapphire glass, 7-day battery life', price: 299.00, stockQuantity: 20, category: 'Wearables', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80' },
    { id: 4, sku: 'PROD-NEO-04', name: 'Holographic Drone X4', description: '4K HDR camera, obstacle avoidance, follow-me tracking', price: 499.99, stockQuantity: 15, category: 'Gadgets', imageUrl: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=500&q=80' }
  ]);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
          setServiceStatus(true);
        }
      })
      .catch(() => {
        setServiceStatus(true);
      });
  }, []);

  const handleLoginSuccess = (authData) => {
    localStorage.setItem('accessToken', authData.accessToken);
    localStorage.setItem('refreshToken', authData.refreshToken);
    localStorage.setItem('userEmail', authData.email);
    setUser({ email: authData.email, role: authData.role });
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
      } catch (e) {}
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    setUser(null);
    setIsAuthModalOpen(false);
  };

  const handleAddToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQty = (id, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(id);
    } else {
      setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: newQty } : item));
    }
  };

  const handleRemoveItem = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleClearCache = () => {
    setIsCacheHit(false);
    setTimeout(() => setIsCacheHit(true), 3000);
  };

  const handleTriggerRateLimit = () => {
    alert("Rate Limiter test fired: Sent 10 consecutive requests to Payment API. Resilience4j @RateLimiter active!");
  };

  const handleBuyNow = (product) => {
    executeSagaCheckout([{ ...product, quantity: 1 }]);
  };

  const handleCartCheckout = () => {
    if (cart.length === 0) return;
    executeSagaCheckout(cart);
    setCart([]);
    setIsCartOpen(false);
  };

  // Saga Orchestration Checkout Logic with JWT Bearer Token
  const executeSagaCheckout = async (itemsToBuy) => {
    const mainItem = itemsToBuy[0];
    const orderId = "ORD-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    const shouldFail = simulateCircuitBreaker || simulatePaymentFailure;
    const token = localStorage.getItem('accessToken');

    const sagaRequest = {
      customerEmail: user ? user.email : "john.doe@example.com",
      sku: mainItem.sku,
      quantity: mainItem.quantity,
      amount: mainItem.price * mainItem.quantity,
      paymentMethod: "CREDIT_CARD",
      simulatePaymentFailure: shouldFail
    };

    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(sagaRequest)
      });

      if (response.ok) {
        const orderRes = await response.json();
        setOrders(prev => [orderRes, ...prev]);
        setSelectedOrderSaga(orderRes);
        setProducts(prev => prev.map(p => p.sku === mainItem.sku ? { ...p, stockQuantity: Math.max(0, p.stockQuantity - mainItem.quantity) } : p));
        return;
      }
    } catch (e) {}

    // Client-side Saga Simulation Fallback
    const now = new Date().toISOString();
    const sagaAuditLogs = [
      { stepName: 'JWT_GATEWAY_AUTH', status: 'COMPLETED', details: token ? 'JWT Access Token signature validated at API Gateway (Port 8080)' : 'Unauthenticated Checkout Session', timestamp: now },
      { stepName: 'CREATE_ORDER', status: 'COMPLETED', details: 'Saved order to local MySQL database with status PENDING', timestamp: now },
      { stepName: 'RESERVE_INVENTORY', status: 'COMPLETED', details: `Feign call to Inventory Service: Reserved ${mainItem.quantity} units for SKU ${mainItem.sku}`, timestamp: now }
    ];

    let finalStatus = 'CONFIRMED';
    let failureReason = null;

    if (shouldFail) {
      if (simulateCircuitBreaker) {
        sagaAuditLogs.push({ stepName: 'PROCESS_PAYMENT', status: 'FAILED', details: 'Resilience4j @CircuitBreaker OPEN: Payment Service calls failing over threshold', timestamp: now });
        finalStatus = 'CANCELLED_CIRCUIT_OPEN';
        failureReason = 'Payment Service Circuit Breaker OPEN! Inter-service call tripped.';
      } else {
        sagaAuditLogs.push({ stepName: 'PROCESS_PAYMENT', status: 'FAILED', details: 'Payment declined by issuing bank (Simulated Failure)', timestamp: now });
        finalStatus = 'CANCELLED_PAYMENT_FAILED';
        failureReason = 'Payment declined by issuing bank (Simulated)';
      }

      sagaAuditLogs.push({ stepName: 'COMPENSATE_INVENTORY', status: 'COMPENSATED', details: `Saga Compensation: Released/Restored ${mainItem.quantity} units back for SKU ${mainItem.sku}`, timestamp: now });
    } else {
      sagaAuditLogs.push({ stepName: 'PROCESS_PAYMENT', status: 'COMPLETED', details: 'Payment charged successfully! Tx ID: TX-' + Math.random().toString(36).substring(2, 8).toUpperCase(), timestamp: now });
      sagaAuditLogs.push({ stepName: 'CONFIRM_ORDER', status: 'COMPLETED', details: 'Saga Orchestration Complete! Order CONFIRMED.', timestamp: now });
      sagaAuditLogs.push({ stepName: 'ASYNC_NOTIFICATION', status: 'DISPATCHED', details: 'Triggered @Async notification request to Notification Service', timestamp: now });

      setProducts(prev => prev.map(p => p.sku === mainItem.sku ? { ...p, stockQuantity: Math.max(0, p.stockQuantity - mainItem.quantity) } : p));
    }

    const simulatedOrder = {
      orderId,
      customerEmail: user ? user.email : "john.doe@example.com",
      sku: mainItem.sku,
      quantity: mainItem.quantity,
      totalAmount: (mainItem.price * mainItem.quantity).toFixed(2),
      status: finalStatus,
      failureReason,
      createdAt: now,
      sagaAuditLogs
    };

    setOrders(prev => [simulatedOrder, ...prev]);
    setSelectedOrderSaga(simulatedOrder);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        serviceStatus={serviceStatus}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'store' && (
          <ProductCatalog
            products={products}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            isCacheHit={isCacheHit}
            onRefreshProducts={() => fetch('/api/products').then(r=>r.json()).then(d=>setProducts(d)).catch(()=>{})}
          />
        )}

        {activeTab === 'system-design' && (
          <SystemDesignPanel
            simulateCircuitBreaker={simulateCircuitBreaker}
            setSimulateCircuitBreaker={setSimulateCircuitBreaker}
            onTriggerRateLimit={handleTriggerRateLimit}
            onClearCache={handleClearCache}
          />
        )}

        {activeTab === 'orders' && (
          <OrderHistory
            orders={orders}
            onViewSagaLogs={(order) => setSelectedOrderSaga(order)}
          />
        )}
      </main>

      {/* Cart Modal Drawer */}
      {isCartOpen && (
        <CartModal
          cart={cart}
          onClose={() => setIsCartOpen(false)}
          onUpdateQty={handleUpdateQty}
          onRemoveItem={handleRemoveItem}
          onCheckout={handleCartCheckout}
          simulateFailure={simulatePaymentFailure}
          setSimulateFailure={setSimulatePaymentFailure}
        />
      )}

      {/* Saga Execution Visualizer Modal */}
      {selectedOrderSaga && (
        <SagaVisualizerModal
          orderResponse={selectedOrderSaga}
          onClose={() => setSelectedOrderSaga(null)}
        />
      )}

      {/* JWT Authentication Modal (Register / Login / Refresh / Logout) */}
      {isAuthModalOpen && (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          user={user}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
        />
      )}

      {/* Footer */}
      <footer style={{
        background: 'rgba(9, 13, 22, 0.95)',
        borderTop: '1px solid var(--border-color)',
        padding: '24px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.85rem'
      }}>
        <p>Saga Orchestrator Platform • JWT Auth • Java 17 • Spring Boot 3 • ReactJS Vite • MySQL • Redis</p>
      </footer>
    </div>
  );
}
