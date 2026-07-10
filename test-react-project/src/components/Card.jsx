import React from 'react';

function Card({ title, children }) {
  return (
    <div style={{
      border: '1px solid #e0e0e0',
      borderRadius: '12px',
      padding: '20px',
      marginTop: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ marginTop: 0, color: '#333' }}>{title}</h3>
      {children}
    </div>
  );
}

export default Card;
