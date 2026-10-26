import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="mb-7 flex flex-col gap-5 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        <h1 className="display-font text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  )
}

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: number | string
  detail: string
  icon: LucideIcon
}) {
  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div>
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          <CardDescription className="mt-1 text-xs">{detail}</CardDescription>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
          <Icon aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const normalized = status?.toLowerCase() ?? 'unknown'
  const label = normalized.replaceAll('_', ' ')
  const variant = ['rejected', 'suspended', 'urgent'].includes(normalized)
    ? 'destructive'
    : ['approved', 'completed', 'published', 'verified', 'active'].includes(normalized)
      ? 'default'
      : ['archived', 'inactive', 'revoked', 'cancelled'].includes(normalized)
        ? 'secondary'
        : 'outline'

  return <Badge variant={variant} className="capitalize">{label}</Badge>
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <Empty className="rounded-xl border border-dashed border-border bg-card px-5 py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon"><Icon aria-hidden="true" /></EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  )
}
