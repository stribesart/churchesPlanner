"use client"

import * as React from "react"
import Image, { type ImageProps } from "next/image"

import { cn } from "@/lib/utils"

function Avatar({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  src,
  alt,
  width = 32,
  height = 32,
  ...props
}: Omit<ImageProps, "src" | "alt"> & {
  src?: string
  alt?: string
}) {
  if (!src) {
    return null
  }

  return (
    <Image
      data-slot="avatar-image"
      src={src}
      alt={alt || ""}
      width={width}
      height={height}
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarFallback, AvatarImage }
