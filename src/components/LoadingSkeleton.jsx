import React from 'react';

function LoadingSkeleton() {
  return (
    <div className="container mt-5" style={{ maxWidth: '850px' }}>
      <div className="text-center mb-4 placeholder-glow">
        <span className="placeholder col-4 rounded bg-secondary" style={{ height: '35px', opacity: 0.2 }}></span>
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="card shadow-sm border-0 rounded-4 mb-4">
          <div className="card-body p-4 placeholder-glow">
            <h5 className="card-title placeholder col-5 rounded bg-secondary" style={{ opacity: 0.2 }}></h5>
            <p className="card-text placeholder col-8 rounded bg-secondary mb-2" style={{ opacity: 0.1 }}></p>
            <p className="card-text placeholder col-4 rounded bg-secondary" style={{ opacity: 0.1 }}></p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default LoadingSkeleton;