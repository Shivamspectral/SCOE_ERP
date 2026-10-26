import { BriefcaseBusiness } from 'lucide-react'
import { PrincipalModulePage } from '@/components/campus/principal-module-page'
export const metadata = { title: 'Placements' }
export default function Page() { return <PrincipalModulePage title='Placements' description='Placement offers, internships, employer activity and student outcomes.' table='placement_records' icon={BriefcaseBusiness} /> }
