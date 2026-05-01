import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary ring-primary/20",
        secondary: "bg-muted text-muted-foreground ring-border",
        success: "bg-green-50 text-green-700 ring-green-600/20",
        warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
        destructive: "bg-red-50 text-red-700 ring-red-600/20",
        outline: "bg-transparent text-foreground ring-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Badge = React.forwardRef(({ className, variant, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(badgeVariants({ variant }), className)}
    {...props}
  />
));
Badge.displayName = "Badge";

export { Badge, badgeVariants };
