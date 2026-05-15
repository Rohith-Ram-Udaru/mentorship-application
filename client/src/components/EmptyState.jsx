import { Sparkles } from "lucide-react";

export function EmptyState({ title, body }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-trust-gradient p-8 text-center">
      <Sparkles className="mx-auto mb-3 text-primary" />
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-foreground/60">{body}</p>
    </div>
  );
}
