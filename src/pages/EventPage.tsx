import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EventCanvas } from '@/components/canvas/EventCanvas'

export default function EventPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()

  if (!eventId) {
    navigate('/')
    return null
  }

  return (
    <div className="flex h-dvh flex-col">
      {/* Slim top bar with back navigation */}
      <div className="shrink-0 flex items-center gap-2 px-3 pt-3">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => navigate('/')}>
          <ArrowLeftIcon className="w-4 h-4" />
          All Events
        </Button>
      </div>
      <div className="flex-1 min-h-0">
        <EventCanvas eventId={eventId} />
      </div>
    </div>
  )
}
