import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-navy outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";
