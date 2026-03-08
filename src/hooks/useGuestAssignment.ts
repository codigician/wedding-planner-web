import { useCallback, useState } from 'react'
import { tableDb } from '@/lib/db'
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
 * Manages guest-to-table assignments.
 *
 * Applies an **optimistic local update** immediately so the UI feels instant,
 * then persists the change to Firestore. If Firestore throws, the local state
 * is rolled back and the guest's status is set to `'error'`.
 *
 * @param tables       - Current tables state array.
 * @param setTables    - State setter for the tables array.
 * @param selectedTableId - The currently selected table's ID (may be null).
 */
export function useGuestAssignment(
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

      // Snapshot for rollback
      const snapshot = tables

      // 1. Optimistic update
      setTables((prev) =>
        prev.map((t) =>
          t.id === selectedTableId && !t.assignedGuests.includes(guestId)
            ? { ...t, assignedGuests: [...t.assignedGuests, guestId] }
            : t,
        ),
      )
      setGuestStatus(guestId, 'loading')

      // 2. Persist to db
      try {
        await tableDb.assignGuestToTable(selectedTableId, guestId)
        setGuestStatus(guestId, 'idle')
      } catch (err) {
        console.error('[useGuestAssignment] assignGuest failed:', err)
        // Rollback
        setTables(snapshot)
        setGuestStatus(guestId, 'error')
      }
    },
    [selectedTableId, tables, setTables],
  )

  const removeGuest = useCallback(
    async (tableId: string, guestId: string) => {
      const snapshot = tables

      // Optimistic update
      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId
            ? { ...t, assignedGuests: t.assignedGuests.filter((id) => id !== guestId) }
            : t,
        ),
      )
      setGuestStatus(guestId, 'loading')

      try {
        await tableDb.removeGuestFromTable(tableId, guestId)
        setGuestStatus(guestId, 'idle')
      } catch (err) {
        console.error('[useGuestAssignment] removeGuest failed:', err)
        setTables(snapshot)
        setGuestStatus(guestId, 'error')
      }
    },
    [tables, setTables],
  )

  return { assignGuest, removeGuest, statusMap }
}
