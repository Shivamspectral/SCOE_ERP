import { Wallet } from 'lucide-react'
import { PrincipalModulePage } from '@/components/campus/principal-module-page'
export const metadata = { title: 'Fees & finance' }
export default function Page() { return <PrincipalModulePage title='Fees & finance' description='Fee collection, outstanding balances, budget tracking and financial approvals.' table='fee_payments' icon={Wallet} /> }
