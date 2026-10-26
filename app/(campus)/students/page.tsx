import { GraduationCap } from 'lucide-react'
import { PrincipalModulePage } from '@/components/campus/principal-module-page'
export const metadata = { title: 'Students' }
export default function Page() { return <PrincipalModulePage title='Students' description='Enrollment records, student directory and student-level academic follow-up.' table='academic_students' icon={GraduationCap} /> }
