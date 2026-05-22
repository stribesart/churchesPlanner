import * as React from "react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

function Field({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field"
      className={cn(
        "group/field grid gap-2 data-[orientation=horizontal]:grid-cols-[auto_1fr] data-[orientation=horizontal]:items-center",
        className
      )}
      {...props}
    />
  )
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn("grid gap-5", className)}
      {...props}
    />
  )
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn("text-sm font-semibold", className)}
      {...props}
    />
  )
}

function FieldDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function FieldError({
  className,
  children,
  ...props
}: React.ComponentProps<"p">) {
  if (!children) {
    return null
  }

  return (
    <p
      data-slot="field-error"
      className={cn("text-xs font-medium text-destructive", className)}
      {...props}
    >
      {children}
    </p>
  )
}

export { Field, FieldDescription, FieldError, FieldGroup, FieldLabel }
