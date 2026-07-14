type BadgeProps = {
  variant?: "default" | "purple" | "green" | "yellow" | "red" | "blue";
  children: React.ReactNode;
  className?: string;
  title?: string;
};

const variantStyles = {
  default: "bg-gray-100 text-gray-700",
  purple: "bg-emerald-50 text-emerald-700",
  green: "bg-green-50 text-green-700",
  yellow: "bg-yellow-50 text-yellow-700",
  red: "bg-red-50 text-red-600",
  blue: "bg-blue-50 text-blue-600",
};

export default function Badge({ variant = "default", children, className = "", title }: BadgeProps) {
  return (
    <span
      title={title}
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
