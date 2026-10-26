'use client'

import { useActionState } from 'react'
import { Check, LoaderCircle } from 'lucide-react'
import { acknowledgeCircularAction } from '@/app/actions'
import { ActionFeedback } from '@/components/forms/action-feedback'
import { Button } from '@/components/ui/button'
import { initialActionState } from '@/lib/campus/action-state'

export function CircularAckButton({ circularId, acknowledged }: { circularId: string; acknowledged: boolean }) {
  const [state, action, pending] = useActionState(acknowledgeCircularAction, initialActionState)
  if (acknowledged) return <span className="inline-flex items-center gap-2 text-xs font-medium text-primary"><Check aria-hidden="true" className="size-4" /> Acknowledged</span>

  return (
    <div className="flex flex-col items-start gap-2">
      <form action={action}>
        <input type="hidden" name="circular_id" value={circularId} />
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Check data-icon="inline-start" />}
          {pending ? 'Saving…' : 'Acknowledge'}
        </Button>
      </form>
      <ActionFeedback state={state} />
    </div>
  )
}
