import React from 'react';

const BackBtn = ({ onClick }) => (
  <button className="fe-back-btn" onClick={onClick} title="Go Back">
    <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: 'none', stroke: '#000', strokeWidth: '2.5' }}>
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  </button>
);

export default BackBtn;
