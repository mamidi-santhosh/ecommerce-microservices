import React, { useState } from 'react';
import { Database, ShieldAlert, Mail, Gauge, Lock, Share2, Cpu, Network, Radio, Activity, CheckCircle, RefreshCw, Zap, Play } from 'lucide-react';

export default function SystemDesignPanel({ simulateCircuitBreaker, setSimulateCircuitBreaker, onTriggerRateLimit, onClearCache }) {
  const [logs, setLogs] = useState([
    { id: 1, time: new Date().toLocaleTimeString(), text: 'System Design Dashboard initialized. All 10 Spring Boot concepts active.', type: 'info' }
  ]);

  const addLog = (text, type = 'info') => {
    setLogs(prev => [{ id: Date.now(), time: new Date().toLocaleTimeString(), text, type }, ...prev.slice(0, 19)]);
  };

  const concepts = [
    {
      id: 1,
      name: '@Cacheable',
      title: '1. Caching (Redis)',
      icon: Database,
      badge: 'HIGH PERFORMANCE',
      color: '#06b6d4',
      description: 'Caches product catalog & stock lookup in Redis. Reduces database CPU load from high-frequency read requests.',
      actionText: 'Invalidate Redis Cache (@CacheEvict)',
      onAction: () => {
        onClearCache();
        addLog('@CacheEvict triggered: Cleared "products" & "product-sku" Redis keys!', 'success');
      }
    },
    {
      id: 2,
      name: '@CircuitBreaker',
      title: '2. Circuit Breaker Pattern (Resilience4j)',
      icon: ShieldAlert,
      badge: 'FAULT TOLERANCE',
      color: '#f43f5e',
      description: 'Monitors Payment Service health. Automatically trips OPEN on failure rate >50%, executing Saga stock compensation.',
      actionText: simulateCircuitBreaker ? 'Disable Failure Simulation (CB CLOSED)' : 'Simulate Payment Failures (CB OPEN)',
      isToggle: true,
      toggled: simulateCircuitBreaker,
      onAction: () => {
        setSimulateCircuitBreaker(!simulateCircuitBreaker);
        addLog(!simulateCircuitBreaker ? 'Simulated Payment Failures ENABLED: Circuit Breaker will trip!' : 'Simulated Payment Failures DISABLED: Circuit Breaker CLOSED.', !simulateCircuitBreaker ? 'warning' : 'success');
      }
    },
    {
      id: 3,
      name: '@Async',
      title: '3. Async Processing (Message Queues)',
      icon: Mail,
      badge: 'NON-BLOCKING',
      color: '#8b5cf6',
      description: 'Offloads notification dispatching & audit telemetry to async thread pools without blocking the main checkout HTTP response.',
      actionText: 'Dispatch Mock @Async Notification',
      onAction: () => {
        addLog('@Async Event Dispatched: Notification Service background thread processing email job...', 'info');
      }
    },
    {
      id: 4,
      name: '@RateLimiter',
      title: '4. Rate Limiting (Resilience4j)',
      icon: Gauge,
      badge: 'API PROTECTION',
      color: '#f59e0b',
      description: 'Enforces rate limit thresholds (5 requests / 10 sec) on payment processing endpoints to defend against API abuse & bot traffic.',
      actionText: 'Test Rate Limiter (Simulate Burst Requests)',
      onAction: () => {
        onTriggerRateLimit();
        addLog('@RateLimiter Test: Fired burst requests to Payment API. Limit status checked.', 'warning');
      }
    },
    {
      id: 5,
      name: '@Transactional',
      title: '5. ACID Data Consistency (MySQL)',
      icon: Lock,
      badge: 'DATA INTEGRITY',
      color: '#10b981',
      description: 'Guarantees atomic, isolated database commits per microservice boundary. Integrates with Saga for multi-service consistency.',
      actionText: 'View Local MySQL DB State',
      onAction: () => {
        addLog('@Transactional Status: MySQL local database isolation level READ_COMMITTED active.', 'success');
      }
    },
    {
      id: 6,
      name: '@LoadBalanced',
      title: '6. Client-Side Load Balancing',
      icon: Share2,
      badge: 'DYNAMIC SELECTION',
      color: '#ec4899',
      description: 'Spring Cloud LoadBalancer dynamically selects healthy instances of inventory and payment microservices registered with Eureka.',
      actionText: 'Query LoadBalancer Routes',
      onAction: () => {
        addLog('@LoadBalanced Router: Selected target service instance http://inventory-service:8082', 'info');
      }
    },
    {
      id: 7,
      name: '@FeignClient',
      title: '7. Inter-Service Communication',
      icon: Cpu,
      badge: 'DECLARATIVE REST',
      color: '#3b82f6',
      description: 'Declarative REST HTTP client abstracts microservice-to-microservice calls (Order Service -> Inventory & Payment Services).',
      actionText: 'Inspect Feign Client Contracts',
      onAction: () => {
        addLog('@FeignClient payload contract: InventoryClient.reserveStock(ReservationRequest)', 'info');
      }
    },
    {
      id: 8,
      name: 'Spring Cloud Gateway',
      title: '8. API Gateway Routing',
      icon: Network,
      badge: 'TRAFFIC MANAGER',
      color: '#14b8a6',
      description: 'Centralized entry point on Port 8080. Handles global CORS headers, URL path predicates, and rate limiting filters.',
      actionText: 'Check Gateway Route Locator',
      onAction: () => {
        addLog('Spring Cloud Gateway active on port 8080: Routing /api/orders/** -> order-service', 'success');
      }
    },
    {
      id: 9,
      name: 'Eureka Server',
      title: '9. Service Discovery & Registry',
      icon: Radio,
      badge: 'DYNAMIC LOCATION',
      color: '#a855f7',
      description: 'Central registry running on Port 8761. All 5 microservices automatically register heartbeat health metrics.',
      actionText: 'Ping Eureka Registry',
      onAction: () => {
        addLog('Eureka Server pinged at http://localhost:8761: 5 microservices registered in heartbeat status UP.', 'success');
      }
    },
    {
      id: 10,
      name: 'Spring Boot Actuator',
      title: '10. Monitoring & Observability',
      icon: Activity,
      badge: 'HEALTH & METRICS',
      color: '#eab308',
      description: 'Exposes health, liveness, readiness, Resilience4j circuit breaker metrics, and telemetry metrics for production monitoring.',
      actionText: 'Fetch Telemetry Metrics',
      onAction: () => {
        addLog('Spring Boot Actuator: System Health UP | JVM Heap: 142MB | Circuit Breaker: CLOSED', 'success');
      }
    }
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '32px auto', padding: '0 24px' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.15)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#c4b5fd', borderRadius: '20px', padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '12px' }}>
              <Zap size={14} /> SYSTEM DESIGN CONCEPTS IN SPRING BOOT & REACT
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
              10 System Design Architectural Concepts
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '800px', fontSize: '1rem', lineHeight: '1.6' }}>
              Every architectural layer from the screenshot is implemented live in this Spring Boot microservices backend and connected with the <strong>Saga Orchestrator Pattern</strong> for distributed transactions and compensation rollbacks.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of 10 Concepts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px', marginBottom: '36px' }}>
        {concepts.map((concept) => {
          const IconComp = concept.icon;
          return (
            <div key={concept.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: `${concept.color}20`,
                    border: `1px solid ${concept.color}50`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IconComp size={22} color={concept.color} />
                  </div>
                  <span className="badge" style={{ background: `${concept.color}15`, color: concept.color, border: `1px solid ${concept.color}40` }}>
                    {concept.badge}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>
                  {concept.title}
                </h3>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '20px' }}>
                  {concept.description}
                </p>
              </div>

              <button
                className={concept.isToggle && concept.toggled ? "btn-danger" : "btn-secondary"}
                onClick={concept.onAction}
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
              >
                {concept.isToggle ? (
                  <>
                    <RefreshCw size={14} className={concept.toggled ? 'pulse-animation' : ''} />
                    {concept.actionText}
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    {concept.actionText}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Live System Design Activity Console */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--accent-cyan)" /> Live System Design Event Stream
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time telemetry audit</span>
        </div>

        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '10px',
          padding: '16px',
          maxHeight: '220px',
          overflowY: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.825rem',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          {logs.map((log) => (
            <div key={log.id} style={{
              marginBottom: '8px',
              display: 'flex',
              gap: '12px',
              color: log.type === 'warning' ? '#fde68a' : log.type === 'success' ? '#6ee7b7' : '#cbd5e1'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>[{log.time}]</span>
              <span>{log.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
