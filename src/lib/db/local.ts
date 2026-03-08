import type { TableDbService } from './types'

const STORAGE_KEY = 'wp_table_assignments'

/** Shape stored in localStorage: { [tableId]: guestId[] } */
type Store = Record<string, string[]>

function load(): Store {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Store
  } catch {
    return {}
  }
}

function save(store: Store): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

/**
 * localStorage-backed implementation of {@link TableDbService}.
 *
 * Data survives page refreshes but is scoped to the browser/origin.
 * Swap this for `firebaseTableService` (src/lib/firebase/tables.ts)
 * once your Firebase project is ready.
 */
export const localTableService: TableDbService = {
  async assignGuestToTable(tableId, guestId) {
    const store = load()
    const existing = store[tableId] ?? []
    if (!existing.includes(guestId)) {
      store[tableId] = [...existing, guestId]
      save(store)
    }
  },

  async removeGuestFromTable(tableId, guestId) {
    const store = load()
    store[tableId] = (store[tableId] ?? []).filter((id) => id !== guestId)
    save(store)
  },
}
