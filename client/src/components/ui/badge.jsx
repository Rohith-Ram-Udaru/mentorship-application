import { cn } from "../../utils/cn";

const tones = {
  blue: "bg-primary/10 text-primary border-primary/20",
  green: "bg-accent/10 text-accent border-accent/20",
  red: "bg-danger/10 text-danger border-danger/20",
  gray: "bg-muted text-foreground/70 border-border",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20"
};

export function Badge({ tone = "gray", className, ...props }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", tones[tone], className)} {...props} />;
}
