import React from 'react';

export const Card = ({ children, className = '', hover = false, onClick }) => {
  const baseStyles = 'bg-white border border-gray-200 rounded-lg shadow-sm';
  const hoverStyles = hover ? 'hover:shadow-md transition-shadow cursor-pointer' : '';

  return (
    <div
      className={`${baseStyles} ${hoverStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
