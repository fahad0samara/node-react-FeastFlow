import React from 'react';

const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} relative`}>
      <div className="absolute w-full h-full rounded-full border-4 border-green-200 opacity-25"></div>
      <div className="absolute w-full h-full rounded-full border-4 border-t-green-500 animate-spin"></div>
      <div className="absolute w-full h-full rounded-full border-4 border-green-500 opacity-20 animate-pulse"></div>
    </div>
  );
};

export default LoadingSpinner;
