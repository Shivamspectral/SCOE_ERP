import { Wrench } from 'lucide-react'
import { PrincipalModulePage } from '@/components/campus/principal-module-page'
export const metadata = { title: 'Facilities & assets' }
export default function Page() { return <PrincipalModulePage title='Facilities & assets' description='Campus assets, classroom readiness, laboratory resources and maintenance requests.' table='maintenance_requests' icon={Wrench} /> }
