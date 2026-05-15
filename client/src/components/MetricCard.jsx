import { motion } from "framer-motion";
import { Card, CardContent } from "./ui/card";

export function MetricCard({ icon: Icon, label, value, detail, accent = "text-primary" }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden">
        <CardContent className="flex items-center gap-4">
          <div className={`rounded-lg bg-muted p-3 shadow-sm ${accent}`}>{Icon && <Icon size={22} />}</div>
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm font-medium text-foreground/70">{label}</div>
            {detail && <div className="mt-1 text-xs text-foreground/50">{detail}</div>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
