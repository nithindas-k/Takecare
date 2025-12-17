import React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
};

const base = "inline-flex items-center justify-center rounded-lg font-semibold transition duration-150";
const variants: Record<string, string> = {
  primary: "bg-[#00A1B0] text-white hover:bg-[#008f9c] shadow-md",
  secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
  ghost: "bg-transparent text-[#00A1B0] hover:underline",
};

const Spinner = () => (
  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
  </svg>
);

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  ...rest
}) => {
  const isDisabled = disabled || loading;
  return (
    <button
      className={`${base} ${variants[variant]} ${isDisabled ? "opacity-60 cursor-not-allowed" : ""} ${className}`}
      disabled={isDisabled}
      {...rest}
    >
      {loading && <Spinner />}
      <span>{children}</span>
    </button>
  );
};

export default Button;
