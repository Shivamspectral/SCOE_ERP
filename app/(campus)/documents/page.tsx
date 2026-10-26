import { FileText, FolderOpen } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DocumentForm } from '@/components/forms/document-form'
import { EmptyState, PageHeading, StatusBadge } from '@/components/campus/ui'
import { getCampusContext } from '@/lib/campus/context'
import { formatDate, humanize } from '@/lib/campus/format'

export const metadata = { title: 'Document register' }

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ expiring?: string; expired?: string }> }) {
  const { supabase, roles } = await getCampusContext()
  const params = await searchParams
  const today = new Date().toISOString().slice(0, 10)
  const inThirtyDays = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  const expiringOnly = params.expiring === '1'
  const expiredOnly = params.expired === '1'
  let documentsQuery = supabase.from('documents').select('id, title, category, department_id, status, expires_at, version, created_at').order('updated_at', { ascending: false }).limit(100)
  if (expiringOnly) documentsQuery = documentsQuery.gte('expires_at', today).lte('expires_at', inThirtyDays)
  if (expiredOnly) documentsQuery = documentsQuery.lt('expires_at', today).neq('status', 'archived')
  const [{ data: documents }, { data: departments }] = await Promise.all([
    documentsQuery,
    supabase.from('departments').select('id, name').eq('status', 'active').order('name'),
  ])
  const items = documents ?? []
  const departmentList = departments ?? []
  const departmentById = new Map(departmentList.map((department) => [department.id, department.name]))
  const canRegister = roles.some((assignment) => ['principal', 'administrator', 'coordinator', 'hod'].includes(assignment.role))

  return (
    <>
      <PageHeading eyebrow={`Campus communications / Records${expiringOnly ? ' / Expiring soon' : expiredOnly ? ' / Expired' : ''}`} title={expiringOnly ? 'Documents expiring in 30 days' : expiredOnly ? 'Expired documents' : 'Document register'} description={expiringOnly ? 'Documents with an expiry date from today through the next 30 days.' : expiredOnly ? 'Non-archived document records whose expiry date has passed.' : 'Keep key institutional records discoverable with owner scope, category, version, and expiry metadata.'} action={expiringOnly || expiredOnly ? <a href="/documents" className="text-sm font-medium text-primary hover:underline">Clear filter</a> : undefined} />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <Card className="border-border/70 shadow-none">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div><CardTitle className="text-lg">Registered documents</CardTitle><CardDescription>Documents visible to your campus role.</CardDescription></div>
            <FolderOpen aria-hidden="true" className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            {items.length ? (
              <Table className="min-w-[570px]">
                <TableCaption>Document records visible to your role.</TableCaption>
                <TableHeader><TableRow><TableHead>Document</TableHead><TableHead>Department</TableHead><TableHead>Status</TableHead><TableHead>Expiry</TableHead></TableRow></TableHeader>
                <TableBody>{items.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell><div className="flex items-start gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary"><FileText aria-hidden="true" className="size-4" /></span><div className="min-w-0"><p className="font-medium">{document.title}</p><p className="mt-1 text-xs text-muted-foreground">{humanize(document.category)} · v{document.version}</p></div></div></TableCell>
                    <TableCell className="text-muted-foreground">{document.department_id ? departmentById.get(document.department_id) ?? 'Department' : 'Campus-wide'}</TableCell>
                    <TableCell><StatusBadge status={document.status} /></TableCell>
                    <TableCell>{document.expires_at ? formatDate(document.expires_at) : 'No expiry'}</TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            ) : (
              <EmptyState icon={FileText} title="The register is empty" description="Add a record for an institutional document to start tracking its category and expiry." />
            )}
          </CardContent>
        </Card>

        {canRegister ? (
          <Card className="border-border/70 shadow-none">
            <CardHeader><CardTitle className="text-lg">Register a document</CardTitle><CardDescription>Add metadata for a file held in your approved institutional storage.</CardDescription></CardHeader>
            <CardContent><DocumentForm departments={departmentList} /></CardContent>
          </Card>
        ) : (
          <Card className="border-border/70 shadow-none">
            <CardHeader><CardTitle className="text-lg">Document access</CardTitle><CardDescription>Register updates are managed by an authorized campus role.</CardDescription></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Your list is scoped to records you own or your department can view.</p></CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
