import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const AnimatedInput: React.FC<AnimatedInputProps> = ({
  label,
  error,
  icon,
  rightIcon,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative">
      <motion.label
        initial={{ y: 0 }}
        animate={{ y: isFocused || props.value ? -24 : 0 }}
        className={`absolute left-0 text-sm transition-colors duration-200 ${
          isFocused ? 'text-green-500' : 'text-gray-500'
        }`}
      >
        {label}
      </motion.label>
      
      <div className="relative">
        {icon && (
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            {icon}
          </span>
        )}
        
        <input
          {...props}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={`glass-input w-full transition-all duration-200 ${
            icon ? 'pl-10' : 'pl-4'
          } ${rightIcon ? 'pr-10' : 'pr-4'} ${
            error ? 'border-red-500 ring-red-500' : ''
          } ${className}`}
        />

        {rightIcon && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightIcon}
          </span>
        )}

        <motion.div
          initial={false}
          animate={{
            scaleX: isFocused ? 1 : 0,
          }}
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500 origin-left"
        />
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-2 text-sm text-red-500"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

export default AnimatedInput;
