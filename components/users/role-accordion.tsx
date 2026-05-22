"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"

const userRoles = [
  { label: "Pastor", value: "pastor" },
  { label: "Líder", value: "lider" },
  { label: "Miembro colaborador", value: "miembro colaborador" },
  { label: "Miembro", value: "miembro" },
] as const

type UserRole = (typeof userRoles)[number]["value"]

type RoleAccordionProps = {
  value: string
  onValueChange: (value: UserRole) => void
}

function normalizeUserRole(value: string): UserRole {
  const normalized = value.trim().toLowerCase()

  if (normalized === "líder") {
    return "lider"
  }

  return userRoles.some((role) => role.value === normalized)
    ? (normalized as UserRole)
    : "miembro"
}

function getRoleLabel(value: string) {
  const normalized = normalizeUserRole(value)
  return userRoles.find((role) => role.value === normalized)?.label ?? "Miembro"
}

function RoleAccordion({ value, onValueChange }: RoleAccordionProps) {
  const selectedRole = normalizeUserRole(value)

  return (
    <Accordion type="single" collapsible className="rounded-lg border">
      <AccordionItem value="roles" className="border-b-0 px-3">
        <AccordionTrigger className="hover:no-underline">
          {getRoleLabel(selectedRole)}
        </AccordionTrigger>
        <AccordionContent className="pb-3">
          <div className="grid gap-2">
            {userRoles.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => onValueChange(role.value)}
                className={cn(
                  "rounded-md border px-3 py-2 text-left text-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  selectedRole === role.value
                    ? "border-primary bg-muted font-medium"
                    : "border-transparent"
                )}
              >
                {role.label}
              </button>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export { RoleAccordion, normalizeUserRole }
export type { UserRole }
