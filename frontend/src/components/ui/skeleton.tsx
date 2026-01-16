import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[#00A1B0]/10 dark:bg-[#00A1B0]/20", className)}
      {...props}
    />
  )
}

export { Skeleton }
