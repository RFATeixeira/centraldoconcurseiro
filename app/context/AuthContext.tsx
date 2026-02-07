'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { User } from 'firebase/auth'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  query,
  collection,
  where,
  getDocs,
  arrayUnion,
} from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'

type UserProfile = {
  name?: string
  cpf?: string
  isAdmin?: boolean
  birthDate?: string
  email?: string
  photo?: string
}

type AuthContextType = {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  profileLoading: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (
    email: string,
    password: string,
    cpf: string,
  ) => Promise<void>
  signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    let isActive = true

    const loadProfile = async () => {
      if (!user) {
        if (isActive) {
          setProfile(null)
          setProfileLoading(false)
        }
        return
      }

      setProfileLoading(true)

      try {
        const snapshot = await getDoc(doc(db, 'users', user.uid))
        const data = snapshot.exists() ? snapshot.data() : null

        if (isActive) {
          setProfile({
            name: data?.name ? String(data.name) : undefined,
            cpf: data?.cpf ? String(data.cpf) : undefined,
            isAdmin: Boolean(data?.isAdmin),
            birthDate: data?.birthDate ? String(data.birthDate) : undefined,
            email: user.email || undefined,
            photo: data?.photo ? String(data.photo) : undefined,
          })
        }
      } catch {
        if (isActive) {
          setProfile(null)
        }
      } finally {
        if (isActive) {
          setProfileLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      isActive = false
    }
  }, [user])

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUpWithEmail = async (
    email: string,
    password: string,
    cpf: string,
  ) => {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    const cpfDigits = cpf.replace(/\D/g, '')

    await result.user.getIdToken()

    await setDoc(
      doc(db, 'users', result.user.uid),
      {
        uid: result.user.uid,
        email,
        cpf,
        cpfDigits,
        isAdmin: false,
        createdAt: serverTimestamp(),
      },
      { merge: true },
    )

    await setDoc(
      doc(db, 'cpf_index', cpfDigits),
      {
        email,
        uid: result.user.uid,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    // Adicionar usuário ao grupo Geral
    try {
      const q = query(collection(db, 'chats'), where('nome', '==', 'Geral'))
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        const generalChatId = snapshot.docs[0].id
        await setDoc(
          doc(db, 'chats', generalChatId),
          {
            members: arrayUnion(result.user.uid),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        )
      }
    } catch (error) {
      console.error('Erro ao adicionar usuário ao grupo Geral:', error)
    }
  }

  const signOutUser = async () => {
    await signOut(auth)
  }

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      profileLoading,
      signInWithEmail,
      signUpWithEmail,
      signOutUser,
    }),
    [user, profile, loading, profileLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
