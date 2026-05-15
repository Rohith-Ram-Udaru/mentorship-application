import { Eye, Lock } from "lucide-react";
import { Badge } from "./ui/badge";

export function PrivacyIndicator({ visibility }) {
  const pairOnly = visibility === "pair";
  return (
    <Badge tone={pairOnly ? "amber" : "green"} className="gap-1">
      {pairOnly ? <Lock size={12} /> : <Eye size={12} />}
      {pairOnly ? "Pair only" : "Pair + Observers"}
    </Badge>
  );
}
