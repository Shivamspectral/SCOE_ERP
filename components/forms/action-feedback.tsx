import { CircleCheck, CircleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { ActionState } from '@/lib/campus/action-state'

export function ActionFeedback({ state }: { state: ActionState }) {
  if (state.status === 'idle' || !state.message) return null
  const isError = state.status === 'error'
  const Icon = isError ? CircleAlert : CircleCheck

  return (
    <Alert variant={isError ? 'destructive' : 'default'} className={isError ? '' : 'border-primary/20 bg-primary/5'}>
      <Icon aria-hidden="true" />
      <AlertTitle>{isError ? 'Needs attention' : 'Saved'}</AlertTitle>
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  )
}
