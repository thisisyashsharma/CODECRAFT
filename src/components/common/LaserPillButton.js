import React from 'react';

const VARIANT_STYLES = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 focus:ring-blue-500/40',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200 dark:bg-[#1f1f1f] dark:hover:bg-[#282828] dark:text-gray-100 dark:border-white/10 focus:ring-white/20',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-500/20 focus:ring-red-500/40',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20 focus:ring-emerald-500/40',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:hover:bg-white/10',
};

const LaserPillButton = ({
  children,
  onClick,
  variant = 'secondary',
  className = '',
  disabled = false,
  type = 'button',
  title = '',
  size = 'md',
  sheen = true,
  ...rest
}) => {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs h-8',
    md: 'px-4 py-2 text-sm h-9 sm:h-10',
    lg: 'px-6 py-2.5 text-base h-11 sm:h-12',
  }[size] || 'px-4 py-2 text-sm h-9 sm:h-10';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        relative inline-flex items-center justify-center gap-2 font-medium rounded-full
        transition-all duration-200 outline-none select-none
        active:translate-y-[0.5px] focus:ring-2
        ${sheen ? 'laser-sheen' : ''}
        ${VARIANT_STYLES[variant] || VARIANT_STYLES.secondary}
        ${sizeStyles}
        ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      {...rest}
    >
      {children}
    </button>
  );
};

export default LaserPillButton;
