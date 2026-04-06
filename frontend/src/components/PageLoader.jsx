import React from 'react';

export default function PageLoader() {
  return (
    <div className="cpm-page-loader-overlay">
      <div className="cpm-whirlwind-container">
        <div className="cpm-whirlwind" />
        <img
          src="/icon-256x256.png"
          className="cpm-loader-logo"
          alt="Chargement..."
        />
      </div>
    </div>
  );
}
