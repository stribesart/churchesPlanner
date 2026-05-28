"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"

type Leader = {
  _id: string
  name?: string
  realName?: string
  displayName?: string
  email?: string
  ministryId?: string | null
}

type LeaderAccordionProps = {
  leaders: Leader[]
  value: string
  onValueChange: (value: string) => void
  invalid?: boolean
}

function getLeaderLabel(leader?: Leader) {
  if (!leader) return "Selecciona un líder"

  const name = leader.name?.trim() || ""
  const ministryId = leader.ministryId?.trim() || ""
  const realName = leader.realName?.trim() || ""
  const displayName = leader.displayName?.trim() || ""

  if (name && name !== ministryId) return name
  if (realName && realName !== ministryId) return realName
  if (displayName && displayName !== ministryId) return displayName

  return leader.email || "Líder sin nombre"
}

function LeaderAccordion({
  leaders,
  value,
  onValueChange,
  invalid = false,
}: LeaderAccordionProps) {
  const selectedLeader = leaders.find((leader) => leader._id === value)
  const selectedLabel = getLeaderLabel(selectedLeader)

  return (
    <Accordion
      type="single"
      collapsible
      aria-invalid={invalid}
      className={cn(
        "rounded-lg border",
        invalid && "border-destructive ring-3 ring-destructive/20"
      )}
    >
      <AccordionItem value="leaders" className="border-b-0 px-3">
        <AccordionTrigger className="hover:no-underline">
          {selectedLabel}
        </AccordionTrigger>
        <AccordionContent className="pb-3">
          {leaders.length > 0 ? (
            <div className="grid gap-2">
              {leaders.map((leader) => (
                <button
                  key={leader._id}
                  type="button"
                  onClick={() => onValueChange(leader._id)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-left text-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    value === leader._id
                      ? "border-primary bg-muted font-medium"
                      : "border-transparent"
                  )}
                >
                  <span className="block">{getLeaderLabel(leader)}</span>
                  {leader.email ? (
                    <span className="block text-xs text-muted-foreground">
                      {leader.email}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : (
            <p className="py-2 text-sm text-muted-foreground">
              No hay líderes disponibles.
            </p>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export { LeaderAccordion }
export type { Leader }
