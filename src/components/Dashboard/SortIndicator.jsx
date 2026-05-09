import React from 'react';

const SortIndicator = ({ sortConfig, columnKey }) => {
  const isActive = sortConfig.key === columnKey;
  
  return (
    <span className={`fe-sort-icon ${isActive ? 'active' : ''}`} style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      transition: 'all 0.2s ease',
      width: '18px',
      marginLeft: '8px',
      color: '#ffffff',
      fontWeight: 'bold'
    }}>
      {isActive ? (
        sortConfig.direction === 'asc' ? (
          <svg width="12" height="12" viewBox="0 0 24 24" style={{ stroke: '#fff', strokeWidth: '3' }}><path fill="none" stroke="currentColor" strokeWidth="4" d="M18 15l-6-6-6 6" /></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" style={{ stroke: '#fff', strokeWidth: '3' }}><path fill="none" stroke="currentColor" strokeWidth="4" d="M6 9l6 6 6-6" /></svg>
        )
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" style={{ opacity: 0.6 }}>
          <path fill="currentColor" d="M12 5l-5 5h10l-5-5zM12 19l5-5H7l5 5z" />
        </svg>
      )}
    </span>
  );
};

export default SortIndicator;
