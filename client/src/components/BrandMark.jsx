import { Activity } from "lucide-react";
import { BRAND } from "../utils/brand";

export function BrandMark({ compact = false }) {
  return (
    <div className="flex items-center gap-2 font-black tracking-normal">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-gradient text-white shadow-glow">
        <Activity size={19} />
      </span>
      {!compact && <span>{BRAND.name}</span>}
    </div>
  );
}
