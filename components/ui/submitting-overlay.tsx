import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { cn } from "@/lib/utils"

type SubmittingOverlayProps = {
  show: boolean
  label?: string
  className?: string
}

function SubmittingOverlay({
  show,
  label = "Procesando...",
  className,
}: SubmittingOverlayProps) {
  if (!show) return null

  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex items-center justify-center bg-background/70 backdrop-blur-[1px]",
        className
      )}
    >
      <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium shadow-sm">
        <LoadingSpinner />
        {label}
      </div>
    </div>
  )
}

export { SubmittingOverlay }
