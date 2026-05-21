import type { LucideIcon } from "lucide-react";
import Card from "./Card";

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
};

export default function StatCard({ label, value, icon: Icon, color = "from-purple-500 to-purple-400" }: StatCardProps) {
  return (
    <Card hover>
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm mb-3`}>
        <Icon size={20} className="text-white" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-400 mt-0.5">{label}</p>
    </Card>
  );
}
