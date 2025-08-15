import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "./badge"
import { CheckCircle, Circle, Loader2, XCircle } from "lucide-react"

export type StepStatus = 'pending' | 'active' | 'completed' | 'error'

export interface StepChipProps {
  label: string
  status: StepStatus
  className?: string
}

const statusStyles: Record<StepStatus, string> = {
  pending: "bg-muted text-muted-foreground border-muted",
  active: "bg-primary text-primary-foreground border-primary animate-pulse",
  completed: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-100",
  error: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-100"
}

const statusIcons: Record<StepStatus, React.ComponentType<any>> = {
  pending: Circle,
  active: Loader2,
  completed: CheckCircle,
  error: XCircle
}

export function StepChip({ label, status, className }: StepChipProps) {
  const Icon = statusIcons[status]
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-all",
        statusStyles[status],
        className
      )}
    >
      <Icon 
        className={cn(
          "h-3 w-3",
          status === 'active' && "animate-spin"
        )} 
      />
      {label}
    </Badge>
  )
}

export interface StepProgressProps {
  steps: Array<{
    id: string
    label: string
    status: StepStatus
  }>
  className?: string
}

export function StepProgress({ steps, className }: StepProgressProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <StepChip label={step.label} status={step.status} />
          {index < steps.length - 1 && (
            <div className="flex items-center">
              <div className="w-4 h-px bg-border" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
