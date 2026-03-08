import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './config'

/** Reference to the Firestore `tables` collection. */
export const tablesCollection = collection(db, 'tables')

/**
 * Adds `guestId` to the `assignedGuests` array of the given table document.
 * Uses `arrayUnion` so the operation is idempotent — calling it twice for the
 * same guest has no effect.
 *
 * @param tableId - Firestore document ID of the table.
 * @param guestId - Firestore document ID of the guest to assign.
 */
export async function assignGuestToTable(tableId: string, guestId: string): Promise<void> {
  const tableRef = doc(tablesCollection, tableId)
  await updateDoc(tableRef, {
    assignedGuests: arrayUnion(guestId),
  })
}

/**
 * Removes `guestId` from the `assignedGuests` array of the given table document.
 *
 * @param tableId - Firestore document ID of the table.
 * @param guestId - Firestore document ID of the guest to remove.
 */
export async function removeGuestFromTable(tableId: string, guestId: string): Promise<void> {
  const tableRef = doc(tablesCollection, tableId)
  await updateDoc(tableRef, {
    assignedGuests: arrayRemove(guestId),
  })
}
