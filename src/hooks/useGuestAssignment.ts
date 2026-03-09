import { useCallback, useState } from 'react'
import { updateEventTables } from '@/lib/firebase/events'
import type { VenueTable } from '@/types/venue'

export type AssignmentStatus = 'idle' | 'loading' | 'error'

interface UseGuestAssignmentReturn {
  /** Assign a guest to the currently selected table with optimistic UI update. */
  assignGuest: (guestId: string) => Promise<void>
  /** Remove a guest from a specific table with optimistic UI update. */
  removeGuest: (tableId: string, guestId: string) => Promise<void>
  /** Per-guest status map so the sidebar can show a spinner or error badge. */
  statusMap: Record<string, AssignmentStatus>
}

/**
 * Manages guest-to-table assignments with Firestore persistence.
 *
 * Applies an **optimistic local update** immediately so the UI feels instant,
 * then persists the full updated tables array to the event document.
 * If the write fails, the local state is rolled back.
 */
export function useGuestAssignment(
  eventId: string,
  tables: VenueTable[],
  setTables: React.Dispatch<React.SetStateAction<VenueTable[]>>,
  selectedTableId: string | null,
): UseGuestAssignmentReturn {
  const [statusMap, setStatusMap] = useState<Record<string, AssignmentStatus>>({})

  const setGuestStatus = (guestId: string, status: AssignmentStatus) =>
    setStatusMap((prev) => ({ ...prev, [guestId]: status }))

  const assignGuest = useCallback(
    async (guestId: string) => {
      if (!selectedTableId) return

      const snapshot = tables
      const updated = tables.map((t) =>
        t.id === selectedTableId && !t.assignedGuests.includes(guestId)
          ? { ...t, assignedGuests: [...t.assignedGuests, guestId] }
          : t,
      )

      setTables(updated)
      setGuestStatus(guestId, 'loading')

      try {
        await updateEventTables(eventId, updated)
        setGuestStatus(guestId, 'idle')
      } catch (err) {
        console.error('[useGuestAssignment] assignGuest failed:', err)
        setTables(snapshot)
        setGuestStatus(guestId, 'error')
      }
    },
    [eventId, selectedTableId, tables, setTables],
  )

  const removeGuest = useCallback(
    async (tableId: string, guestId: string) => {
      const snapshot = tables
      const updated = tables.map((t) =>
        t.id === tableId
          ? { ...t, assignedGuests: t.assignedGuests.filter((id) => id !== guestId) }
          : t,
      )

      setTables(updated)
      setGuestStatus(guestId, 'loading')

      try {
        await updateEventTables(eventId, updated)
        setGuestStatus(guestId, 'idle')
      } catch (err) {
        console.error('[useGuestAssignment] removeGuest failed:', err)
        setTables(snapshot)
        setGuestStatus(guestId, 'error')
      }
    },
    [eventId, tables, setTables],
  )

  return { assignGuest, removeGuest, statusMap }
}
