import { useCallback, useState } from 'react'
import { updateEventCanvas } from '@/lib/firebase/canvas'
import type { CanvasElement, TableElement } from '@/types/canvas'

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
 * then persists the full updated elements array to the event document.
 * If the write fails, the local state is rolled back.
 */
export function useGuestAssignment(
  eventId: string,
  elements: CanvasElement[],
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>,
  selectedTableId: string | null,
): UseGuestAssignmentReturn {
  const [statusMap, setStatusMap] = useState<Record<string, AssignmentStatus>>({})

  const setGuestStatus = (guestId: string, status: AssignmentStatus) =>
    setStatusMap((prev) => ({ ...prev, [guestId]: status }))

  const assignGuest = useCallback(
    async (guestId: string) => {
      if (!selectedTableId) return

      const snapshot = elements
      const updated = elements.map((el) =>
        el.type === 'table' && el.id === selectedTableId && !el.assignedGuests.includes(guestId)
          ? { ...el, assignedGuests: [...el.assignedGuests, guestId] }
          : el,
      )

      setElements(updated)
      setGuestStatus(guestId, 'loading')

      try {
        await updateEventCanvas(eventId, updated)
        setGuestStatus(guestId, 'idle')
      } catch (err) {
        console.error('[useGuestAssignment] assignGuest failed:', err)
        setElements(snapshot)
        setGuestStatus(guestId, 'error')
      }
    },
    [eventId, selectedTableId, elements, setElements],
  )

  const removeGuest = useCallback(
    async (tableId: string, guestId: string) => {
      const snapshot = elements
      const updated = elements.map((el) =>
        el.type === 'table' && el.id === tableId
          ? { ...el, assignedGuests: (el as TableElement).assignedGuests.filter((id) => id !== guestId) }
          : el,
      )

      setElements(updated)
      setGuestStatus(guestId, 'loading')

      try {
        await updateEventCanvas(eventId, updated)
        setGuestStatus(guestId, 'idle')
      } catch (err) {
        console.error('[useGuestAssignment] removeGuest failed:', err)
        setElements(snapshot)
        setGuestStatus(guestId, 'error')
      }
    },
    [eventId, elements, setElements],
  )

  return { assignGuest, removeGuest, statusMap }
}

