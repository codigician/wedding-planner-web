import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { auth, googleProvider } from './config'

export async function signUpWithEmail(email: string, password: string, displayName?: string): Promise<User> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  if (displayName) {
    await updateProfile(user, { displayName })
  }
  return user
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  return user
}

export async function signInWithGoogle(): Promise<User> {
  const { user } = await signInWithPopup(auth, googleProvider)
  return user
}

export async function signOutUser(): Promise<void> {
  await signOut(auth)
}
