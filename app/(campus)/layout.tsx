import { CampusShell } from '@/components/campus/shell'
import { getCampusContext } from '@/lib/campus/context'

export default async function CampusLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const context = await getCampusContext()
  return <CampusShell context={context}>{children}</CampusShell>
}
