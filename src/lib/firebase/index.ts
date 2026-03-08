// Re-export all Firebase utilities from one place.
// Swap this file when swapping Firebase environments (dev vs prod).

export { weddingEventConverter } from './converters'
export { db, app } from './config'
export { assignGuestToTable, removeGuestFromTable, tablesCollection } from './tables'
