import React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string | null;
  id?: string;
  description?: string;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, description, className = "", ...rest }, ref) => {
    const inputId = id ?? (rest.name as string) ?? undefined;
    return (
      <div>
        {label && (
          <label htmlFor={inputId} className="block text-gray-700 font-medium mb-2">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition ${
            error ? "border-red-400" : "border-gray-300"
          } ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : description ? `${inputId}-desc` : undefined}
          {...rest}
        />
        {description && !error && (
          <p id={`${inputId}-desc`} className="text-xs text-gray-500 mt-1">
            {description}
          </p>
        )}
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
export default Input;
