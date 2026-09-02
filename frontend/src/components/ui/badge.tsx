import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors duration-200 ease-in-out focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3! shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs [a]:hover:bg-primary/80",
        secondary:
          "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 [a]:hover:bg-slate-200 dark:[a]:hover:bg-slate-700",
        destructive:
          "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200/80 dark:border-red-800/60 [a]:hover:bg-red-100 dark:[a]:hover:bg-red-900/50",
        outline:
          "border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 [a]:hover:bg-slate-100 dark:[a]:hover:bg-slate-800",
        ghost:
          "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
        link: "text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
