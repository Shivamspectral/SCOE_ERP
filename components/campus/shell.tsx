import { OrbitaPortal } from '@/components/orbita-max/portal'
import type { CampusContext } from '@/lib/campus/context'

export function CampusShell({ context: _context, children: _children }: { context: CampusContext; children: React.ReactNode }) {
  return <OrbitaPortal />
}
