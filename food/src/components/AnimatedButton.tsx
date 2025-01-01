import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  icon,
  className = '',
  ...props
}) => {
  const baseStyles = 'relative px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'glass-button',
    secondary: 'glass-button bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-white',
    ghost: 'hover:bg-green-500/10 text-green-500'
  };

  return (
    <motion.button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      {...props}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-t-2 border-b-2 border-current rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {icon && <span className="text-xl">{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
};

export default AnimatedButton;
