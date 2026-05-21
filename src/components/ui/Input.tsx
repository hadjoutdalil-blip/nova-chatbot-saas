import { InputHTMLAttributes, forwardRef } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`w-full border rounded-lg px-3 py-2 text-sm transition-all duration-150 bg-white
          border-gray-200 placeholder:text-gray-400
          focus:border-purple-300 focus:ring-2 focus:ring-purple-500/20 focus:outline-none
          ${error ? "border-red-300 focus:border-red-300 focus:ring-red-500/20" : ""}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";

export default Input;
