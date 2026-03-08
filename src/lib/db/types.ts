/**
 * Database service interface for table-guest assignments.
 *
 * Both the local-storage adapter and the Firebase adapter implement this,
 * so the rest of the app stays completely unaware of the backend.
 */
export interface TableDbService {
  assignGuestToTable(tableId: string, guestId: string): Promise<void>
  removeGuestFromTable(tableId: string, guestId: string): Promise<void>
}
