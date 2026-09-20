import React from 'react';

const LineDrawIcon = ({ icon: Icon, size = 18, className = '', ...props }) => {
  if (!Icon) return null;

  return (
    <span className={`inline-flex items-center justify-center line-draw-trigger ${className}`}>
      <Icon
        size={size}
        className="transition-transform duration-200"
        strokeWidth={2}
        {...props}
      />
    </span>
  );
};

export default LineDrawIcon;
