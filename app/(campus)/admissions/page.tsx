import { Users } from 'lucide-react'
import { PrincipalModulePage } from '@/components/campus/principal-module-page'
export const metadata = { title: 'Admissions' }
export default function Page() { return <PrincipalModulePage title='Admissions' description='Application pipeline, admission decisions and enrollment conversion.' table='admission_applications' icon={Users} /> }
