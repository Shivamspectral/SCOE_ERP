import { markNotificationReadAction } from '@/app/actions'
import { Button } from '@/components/ui/button'

export function NotificationReadButton({ notificationId }: { notificationId: string }) {
  return (
    <form action={markNotificationReadAction}>
      <input type="hidden" name="notification_id" value={notificationId} />
      <Button type="submit" variant="outline" size="sm">Mark as read</Button>
    </form>
  )
}
