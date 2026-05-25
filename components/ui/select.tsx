import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      className={cn(
        "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-navy outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Select.displayName = "Select";
