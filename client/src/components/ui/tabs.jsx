import { cn } from "../../utils/cn";

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-lg bg-muted p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-semibold transition",
            value === tab.value ? "bg-card text-foreground shadow-sm" : "text-foreground/60 hover:text-foreground"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
