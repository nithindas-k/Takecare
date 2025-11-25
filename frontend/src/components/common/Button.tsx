import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, ...props }) => {
  const base = 'px-6 py-2 rounded font-medium transition shadow-sm';
  const styles =
    variant === 'primary'
      ? 'bg-teal-600 text-white hover:bg-teal-700'
      : 'bg-gray-100 text-teal-700 hover:bg-gray-200';

  return (
    <button className={`${base} ${styles}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
