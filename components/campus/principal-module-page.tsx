import Link from 'next/link'
import { ArrowLeft, Database, CircleAlert } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeading } from '@/components/campus/ui'
import { getCampusContext } from '@/lib/campus/context'
import { isDemoMode } from '@/lib/supabase/config'

export async function PrincipalModulePage({ title, description, table, icon: Icon }: { title: string; description: string; table: string; icon: typeof Database }) {
  const { supabase } = await getCampusContext()
  const demo = isDemoMode()
  const result = await supabase.from(table).select('*', { count: 'exact', head: true })
  const connected = !demo && !result.error
  const count = connected ? (result.count ?? 0) : null
  return <div className="space-y-6">
    <PageHeading eyebrow="Principal console / Institutional management" title={title} description={description} />
    <Card className="border-border/70 shadow-none"><CardHeader className="flex flex-row items-start gap-3"><span className="flex size-10 items-center justify-center rounded-lg bg-muted text-primary"><Icon className="size-5" /></span><div><CardTitle className="text-base">Connected records</CardTitle><CardDescription>Live count from the configured data source.</CardDescription></div></CardHeader><CardContent><p className="text-3xl font-semibold">{count === null ? 'Not connected' : count.toLocaleString('en-IN')}</p><p className="mt-2 text-sm text-muted-foreground">{connected ? (count === 0 ? 'The data source is connected, but no records have been added yet.' : 'Count reflects records available to your signed-in account and its access policies.') : 'This module has no seeded sample records. Connect the corresponding Supabase table and permissions to activate it.'}</p></CardContent></Card>
    {!connected ? <div className="flex items-start gap-3 rounded-xl border border-dashed border-border p-4"><CircleAlert className="mt-0.5 size-5 shrink-0 text-muted-foreground" /><div><p className="text-sm font-medium">Integration required</p><p className="mt-1 text-sm text-muted-foreground">This page is intentionally data-free in the prototype. No invented rows or totals are displayed.</p></div></div> : null}
    <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"><ArrowLeft className="size-4" /> Back to principal dashboard</Link>
  </div>
}
