"use client";

import {
  Layout,
  Home,
  Package,
  Banknote,
  Briefcase,
  Landmark,
  Sparkles,
  BarChart3,
  Save,
} from "lucide-react";

const NAV: { id: string; label: string; icon: React.ElementType }[] = [
  { id: "map", label: "World Map", icon: Layout },
  { id: "home", label: "My Home", icon: Home },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "bank", label: "Bank", icon: Banknote },
  { id: "businesses", label: "Businesses", icon: Briefcase },
  { id: "properties", label: "Properties", icon: Landmark },
  { id: "dreams", label: "Dreams", icon: Sparkles },
  { id: "financial", label: "Financial", icon: BarChart3 },
  { id: "save", label: "Save & Backup", icon: Save },
];

interface MainNavProps {
  active: string | null;
  onSelect: (id: string) => void;
}

export default function MainNav({ active, onSelect }: MainNavProps) {
  return (
    <div className="fixed left-0 top-20 z-30 flex flex-col gap-1 p-1">
      {NAV.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto transition-colors ${
              isActive
                ? "bg-glacial text-black shadow-lg shadow-game"
                : "bg-[#12141b] border border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100"
            }`}
            title={item.label}
          >
            <item.icon className="h-5 w-5" />
          </button>
        );
      })}
    </div>
  );
}
