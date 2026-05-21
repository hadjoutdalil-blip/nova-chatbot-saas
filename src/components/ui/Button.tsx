"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

const variants = {
  primary:
    "bg-purple-600 text-white shadow-sm hover:bg-purple-700 active:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed",
  secondary:
    "bg-white text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed",
  ghost:
    "text-gray-600 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed",
  danger:
    "text-red-600 hover:bg-red-50 active:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed",
};

const sizes = {
  sm: "px-2.5 py-1.5 text-xs rounded-md",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-6 py-2.5 text-base rounded-xl",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = "Button";

export default Button;
