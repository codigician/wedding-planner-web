import type { TableDbService } from './types'
import {
  assignGuestToTable,
  removeGuestFromTable,
} from '@/lib/firebase/tables'

/**
 * Firebase Firestore adapter — wraps the existing firebase/tables functions
 * so they satisfy the {@link TableDbService} interface.
 */
export const firebaseTableService: TableDbService = {
  assignGuestToTable,
  removeGuestFromTable,
}
