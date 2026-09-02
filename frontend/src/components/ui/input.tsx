import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      step={type === "number" ? "any" : undefined}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-2.5 py-1 text-sm font-semibold text-slate-900 dark:text-slate-100 transition-colors duration-200 ease-in-out outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal focus-visible:border-blue-500 dark:focus-visible:border-blue-400 focus-visible:ring-3 focus-visible:ring-blue-500/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
