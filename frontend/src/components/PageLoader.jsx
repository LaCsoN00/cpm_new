import React from 'react';

export default function PageLoader() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'var(--bg-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999
    }}>
      <div className="cpm-premium-loader" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img 
          src="/favicon.svg" 
          alt="Chargement CPM..." 
          style={{ 
            width: 80, 
            height: 80, 
            objectFit: 'contain' 
          }} 
        />
      </div>
    </div>
  );
}
