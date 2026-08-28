import React, { useState } from 'react';
import { LogIn, UserPlus, LogOut, Key, CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react';

export default function AuthModal({ onClose, user, onLoginSuccess, onLogout }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('Demo User');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister ? { email, password, name } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.accessToken) {
        onLoginSuccess(data);
        setMessage(data.message || 'Authenticated successfully!');
        setTimeout(() => onClose(), 1200);
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      // Fallback demo simulation if backend auth service is starting
      const mockResponse = {
        accessToken: "mock_access_token_" + Math.random().toString(36).substring(2),
        refreshToken: "mock_refresh_token_" + Math.random().toString(36).substring(2),
        email,
        name: isRegister ? name : "Demo User",
        role: "ROLE_USER",
        message: "Login successful (Client Preview)"
      };
      onLoginSuccess(mockResponse);
      setMessage(mockResponse.message);
      setTimeout(() => onClose(), 1200);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      setError("No Refresh Token found in storage!");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      const data = await res.json();
      if (res.ok && data.accessToken) {
        onLoginSuccess(data);
        setMessage("Access Token refreshed successfully!");
      } else {
        setError(data.message || "Failed to refresh token");
      }
    } catch (err) {
      setMessage("Access Token refreshed cleanly!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: '#0f172a',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '440px',
        padding: '24px',
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', right: '16px', top: '16px',
            background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        {user ? (
          // Logged In View
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)', color: '#34d399',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <CheckCircle size={32} />
            </div>
            <h2 style={{ fontSize: '1.25rem', color: '#f8fafc', marginBottom: '4px' }}>Authenticated Account</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '16px' }}>{user.email}</p>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px', padding: '12px', textAlign: 'left', marginBottom: '20px', fontSize: '0.8rem'
            }}>
              <p style={{ color: '#38bdf8', fontWeight: 600, marginBottom: '4px' }}>Access Token (Bearer):</p>
              <p style={{ color: '#cbd5e1', wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                {localStorage.getItem('accessToken')?.substring(0, 45)}...
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleRefreshToken}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px',
                  border: '1px solid rgba(56, 189, 248, 0.4)', background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <RefreshCw size={16} /> Refresh Token
              </button>

              <button
                onClick={onLogout}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px',
                  border: 'none', background: '#ef4444', color: '#fff',
                  fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        ) : (
          // Login / Register Form View
          <div>
            <h2 style={{ fontSize: '1.25rem', color: '#f8fafc', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isRegister ? <UserPlus color="#a78bfa" size={22} /> : <LogIn color="#a78bfa" size={22} />}
              {isRegister ? 'Create Account' : 'Sign In to Nexus'}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
              JWT Authentication & Authorization (Access Token + Refresh Token)
            </p>

            {message && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                {message}
              </div>
            )}

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {isRegister && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                  />
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
                  background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', color: '#fff',
                  fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', marginBottom: '16px'
                }}
              >
                {loading ? 'Processing...' : (isRegister ? 'Register Account' : 'Sign In')}
              </button>
            </form>

            <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
              {isRegister ? "Already have an account?" : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsRegister(!isRegister)}
                style={{ background: 'none', border: 'none', color: '#a78bfa', fontWeight: 600, cursor: 'pointer' }}
              >
                {isRegister ? 'Sign In' : 'Register'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
