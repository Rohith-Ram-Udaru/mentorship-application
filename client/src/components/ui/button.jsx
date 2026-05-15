import { cva } from "class-variance-authority";
import { cn } from "../../utils/cn";

const variants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-brand-gradient text-white shadow-glow hover:-translate-y-0.5 hover:brightness-110",
        secondary: "bg-muted text-foreground hover:bg-border hover:-translate-y-0.5",
        ghost: "hover:bg-muted hover:text-primary",
        outline: "border border-border bg-card/70 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-muted",
        danger: "bg-danger text-white hover:-translate-y-0.5 hover:brightness-110"
      },
      size: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
        lg: "h-12 px-5",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: { variant: "default", size: "md" }
  }
);

export function Button({ className, variant, size, ...props }) {
  return <button className={cn(variants({ variant, size }), className)} {...props} />;
}
