import { HTMLAttributes, forwardRef } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
};

const paddings = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = false, padding = "md", className = "", children, ...props }, ref) => (
    <div
      ref={ref}
      className={`bg-white rounded-xl border border-gray-100 shadow-card ${
        hover ? "hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200" : ""
      } ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = "Card";

export default Card;
