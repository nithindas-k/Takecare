import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, disabled = false, ...props }) => {
  const base = 'px-6 py-2 rounded font-medium transition shadow-sm';
  const variantStyles = {
    primary: disabled
      ? 'bg-gray-300 text-white cursor-not-allowed'
      : 'bg-[#00A1B0] text-white hover:bg-[#008f9c]',
    secondary: disabled
      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    danger: disabled
      ? 'bg-red-300 text-white cursor-not-allowed'
      : 'bg-red-500 text-white hover:bg-red-600',
  };

  return (
    <button className={`${base} ${variantStyles[variant]}`} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

export default Button;
