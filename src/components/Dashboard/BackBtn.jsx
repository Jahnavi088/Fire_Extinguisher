import React from 'react';

const BackBtn = ({ onClick, children }) => (
  <button className="fe-back-btn" onClick={onClick} title="Go Back">
    <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: 'none', stroke: 'currentColor', strokeWidth: '2.5' }}>
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
    {children}
  </button>
);

export default BackBtn;
