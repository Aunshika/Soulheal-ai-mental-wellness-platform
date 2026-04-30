import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
          <div className="logo-icon"><i className="fi fi-sr-heart" /></div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700 }}>
            Soul<span style={{ color: 'var(--primary)' }}>Heal</span>
          </span>
        </div>
        <div className="spinner" style={{ margin: '0 auto' }} />
        <p>Loading your wellness space...</p>
      </div>
    </div>
  );
}
