'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../app/context/AuthContext'

const PUBLIC_ROUTES = ['/login', '/register']

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (loading) {
      return
    }

    const isPublic = PUBLIC_ROUTES.includes(pathname)

    if (!user && !isPublic) {
      router.replace('/login')
      return
    }

    if (user && isPublic) {
      router.replace('/')
    }
  }, [loading, pathname, router, user])

  if (loading) {
    return null
  }

  const isPublic = PUBLIC_ROUTES.includes(pathname)

  if (!user && !isPublic) {
    return null
  }

  if (user && isPublic) {
    return null
  }

  return <>{children}</>
}
