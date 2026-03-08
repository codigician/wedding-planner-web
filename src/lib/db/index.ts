/**
 * Active database service.
 *
 * To switch to Firebase once your project is ready:
 *   1. Replace `localTableService` below with `firebaseTableService`
 *   2. Fill in .env.local with your Firebase credentials
 *
 * That single line change is all that's needed — no other file touches the backend.
 */
import { localTableService } from './local'
// import { firebaseTableService } from './firebase'  ← uncomment when ready

export const tableDb = localTableService
// export const tableDb = firebaseTableService

export type { TableDbService } from './types'
