'use client'

import { useMemo } from 'react'
import {
  ArrowRightStartOnRectangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../app/context/AuthContext'
import { maskCpf } from '../lib/formatters'

export default function Header() {
  const { user, profile, profileLoading, signOutUser } = useAuth()
  const router = useRouter()

  const formatNameAbrev = (name: string): string => {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) {
      return parts[0]
    }
    return `${parts[0]} ${parts[1][0]}.`
  }

  const profileLabel = useMemo(() => {
    if (profileLoading) {
      return 'Carregando...'
    }

    const name =
      profile?.name ||
      profile?.cpf ||
      user?.displayName ||
      user?.email ||
      'Perfil'

    if (profile?.name) {
      return formatNameAbrev(profile.name)
    }

    if (profile?.cpf) {
      return maskCpf(profile.cpf)
    }

    return name
  }, [profile, profileLoading, user])

  const handleSignOut = async () => {
    await signOutUser()
    router.replace('/login')
  }

  return (
    <div className="hidden md:flex sticky top-0 z-200 items-center justify-center h-22 px-6 gap-4 ">
      {/* Seção Esquerda */}
      <div className="flex-1 flex justify-start items-center">
        <div className="glassmorphism-pill h-16">
          <Image
            src="/logo-centraldoconcurseiro.png"
            alt="Central do Concurseiro Logo"
            width={50}
            height={50}
          ></Image>
          <Link href="/">Central Do Concurseiro</Link>
        </div>
      </div>

      {/* Seção Centro */}
      <div className="flex-1 flex justify-center items-center">
        <div className="glassmorphism-pill h-16 flex items-center divide-x divide-white/10">
          <Link href="/" className="pr-5 button-hover-1">
            Inicio
          </Link>
          <div className="relative group">
            <Link href="/concursos" className="pl-3 pr-5 button-hover-1">
              Concursos
            </Link>
            <div className="absolute top-full left-0 right-0 h-6" />
          </div>
          <Link href="/chat" className="pl-3 button-hover-1 pr-5">
            Chat
          </Link>
          <Link href="/simulados" className="pl-3 button-hover-1">
            Simulados
          </Link>
        </div>
      </div>

      {/* Seção Direita */}
      <div className="flex-1 flex justify-end items-center">
        <div className="glassmorphism-pill h-16 gap-4">
          {user ? (
            <Link
              href="/perfil"
              className="button-hover-1 flex items-center gap-2"
            >
              {profile?.photo && (
                <Image
                  src={profile.photo}
                  alt="Foto do perfil"
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              )}
              <span>{profileLabel}</span>
            </Link>
          ) : (
            <Link href="/login" className="button-hover-1">
              Entrar
            </Link>
          )}
          {user && profile?.isAdmin && (
            <Link href="/admin" aria-label="Admin" className="button-hover-1">
              <ShieldCheckIcon className="h-5 w-5" />
            </Link>
          )}
          {user && (
            <button
              type="button"
              aria-label="Sair"
              className="button-hover-1"
              onClick={handleSignOut}
            >
              <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
