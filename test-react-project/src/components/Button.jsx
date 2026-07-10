import React from 'react';

function Button({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 24px',
        background: '#4a6cf7',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        cursor: 'pointer'
      }}
    >
      {children}
    </button>
  );
}

export default Button;
