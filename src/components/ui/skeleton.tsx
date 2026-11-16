import { cn } from "@/lib/utils"

/**
 * Shared skeleton placeholder. Uses a subtle shimmer (see `.skeleton-shimmer` in globals.css)
 * that is automatically disabled when the user prefers reduced motion.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("skeleton-shimmer rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
