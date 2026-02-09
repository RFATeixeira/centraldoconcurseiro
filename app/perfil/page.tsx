'use client'

import { useEffect, useMemo, useState } from 'react'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { sendEmailVerification } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { db } from '../../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { maskCpf } from '../../lib/formatters'
import Image from 'next/image'
import { XMarkIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

type ProfileFormState = {
  name: string
  email: string
  cpf: string
  birthDate: string
  photo: string
}

const emptyProfile: ProfileFormState = {
  name: '',
  email: '',
  cpf: '',
  birthDate: '',
  photo: '',
}

const formatCpf = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) {
    return digits
  }
  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`
  }
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(
    6,
    9,
  )}-${digits.slice(9)}`
}

const formatBirthDate = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) {
    return digits
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

const formatDate = (value?: Date | null) => {
  if (!value) {
    return '-'
  }
  return value.toLocaleDateString('pt-BR')
}

export default function Perfil() {
  const { user, loading, signOutUser, profile: authProfile } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileFormState>(emptyProfile)
  const [createdAt, setCreatedAt] = useState<Date | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isCpfFocused, setIsCpfFocused] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSendingVerification, setIsSendingVerification] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState<string | null>(
    null,
  )
  const [verificationError, setVerificationError] = useState<string | null>(
    null,
  )

  useEffect(() => {
    if (loading) {
      return
    }

    if (!user) {
      setProfile(emptyProfile)
      setCreatedAt(null)
      router.replace('/login')
      return
    }

    let isActive = true

    const loadProfile = async () => {
      setFetchError(null)
      try {
        const snapshot = await getDoc(doc(db, 'users', user.uid))
        const data = snapshot.exists() ? snapshot.data() : null

        if (!isActive) {
          return
        }

        const createdAtValue = data?.createdAt
        const createdDate =
          createdAtValue && typeof createdAtValue.toDate === 'function'
            ? createdAtValue.toDate()
            : null

        setProfile({
          name: String(data?.name ?? user.displayName ?? ''),
          email: String(data?.email ?? user.email ?? ''),
          cpf: formatCpf(String(data?.cpf ?? '')),
          birthDate: formatBirthDate(String(data?.birthDate ?? '')),
          photo: String(data?.photo ?? ''),
        })
        setCreatedAt(createdDate)
      } catch {
        if (isActive) {
          setFetchError('Nao foi possivel carregar seus dados.')
        }
      }
    }

    loadProfile()

    return () => {
      isActive = false
    }
  }, [loading, router, user])

  const emailVerifiedLabel = useMemo(() => {
    if (!user) {
      return '-'
    }
    return user.emailVerified ? 'Sim' : 'Nao'
  }, [user])

  const handleSignOut = async () => {
    await signOutUser()
    router.replace('/login')
  }

  const handleSendVerificationEmail = async () => {
    if (!user) {
      return
    }

    setIsSendingVerification(true)
    setVerificationMessage(null)
    setVerificationError(null)

    try {
      await sendEmailVerification(user)
      setVerificationMessage('Email de verificacao enviado com sucesso!')
      setTimeout(() => {
        setVerificationMessage(null)
      }, 3000)
    } catch {
      setVerificationError('Nao foi possivel enviar email de verificacao.')
    } finally {
      setIsSendingVerification(false)
    }
  }

  const handleSave = async () => {
    if (!user) {
      return
    }

    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      const cpfDigits = profile.cpf.replace(/\D/g, '')

      await setDoc(
        doc(db, 'users', user.uid),
        {
          name: profile.name.trim(),
          email: profile.email.trim(),
          cpf: profile.cpf.trim(),
          cpfDigits,
          birthDate: profile.birthDate.trim(),
          photo: profile.photo,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      setSaveSuccess('Dados salvos com sucesso.')
      setTimeout(() => {
        setSaveSuccess(null)
      }, 2000)
    } catch {
      setSaveError('Nao foi possivel salvar seus dados.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="w-full min-h-full flex p-4 pb-24 md:pb-4 justify-center">
      <div className="w-full max-w-2xl md:w-140 h-fit flex flex-col items-center justify-center gap-4 z-50">
        <div className="w-full justify-start pt-4 text-right md:text-left">
          <h1 className="text-3xl ">Meu Perfil</h1>
          <p className="text-cyan-200">
            Gerencie sua informações pessoais e preferências
          </p>
        </div>
        <div className="glassmorphism-pill w-full p-6 rounded-4xl flex flex-col">
          {fetchError && (
            <div className="rounded-full backdrop-blur-sm bg-red-500/20 border border-red-400/30 p-4 mb-4">
              <p className="text-sm font-medium text-red-200">{fetchError}</p>
            </div>
          )}
          {saveError && (
            <div className="rounded-full backdrop-blur-sm bg-red-500/20 border border-red-400/30 p-4 mb-4">
              <p className="text-sm font-medium text-red-200">{saveError}</p>
            </div>
          )}
          {saveSuccess && (
            <div className="rounded-full backdrop-blur-sm bg-green-500/20 border border-green-400/30 p-4 mb-4">
              <p className="text-sm font-medium text-green-200">
                {saveSuccess}
              </p>
            </div>
          )}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p>Nome de Usuário</p>
              <input
                type="text"
                className="input-style-1 w-full"
                value={profile.name}
                onChange={(event) =>
                  setProfile((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <p>Email</p>
              <input
                type="text"
                className="input-style-1 w-full"
                value={profile.email}
                onChange={(event) =>
                  setProfile((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex flex-col gap-2 w-full">
                <p>CPF</p>
                <input
                  type="text"
                  className="input-style-1 w-full"
                  value={isCpfFocused ? profile.cpf : maskCpf(profile.cpf)}
                  onFocus={() => setIsCpfFocused(true)}
                  onBlur={() => setIsCpfFocused(false)}
                  onChange={(event) =>
                    setProfile((prev) => ({
                      ...prev,
                      cpf: formatCpf(event.target.value),
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2 w-full">
                <p>Data de Nascimento</p>
                <input
                  type="text"
                  className="input-style-1 w-full"
                  value={profile.birthDate}
                  onChange={(event) =>
                    setProfile((prev) => ({
                      ...prev,
                      birthDate: formatBirthDate(event.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              <div className="flex flex-col gap-2 w-full ">
                <p>Foto de Perfil</p>
                <input
                  type="file"
                  accept="image/*"
                  className="input-style-1 w-full"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (e) => {
                        const base64 = e.target?.result as string
                        setProfile((prev) => ({
                          ...prev,
                          photo: base64,
                        }))
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                />
              </div>
              {profile.photo && (
                <div className="w-full md:w-fit justify-center flex items-center">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="relative group"
                  >
                    <Image
                      src={profile.photo}
                      alt="Preview"
                      className="rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      width={80}
                      height={80}
                    />
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row justify-around items-center gap-2 mt-4 w-full">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !user}
                className="button-cyan"
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>

              {authProfile?.isAdmin && (
                <Link
                  href="/admin"
                  className="button-cyan flex items-center gap-2"
                  title="Painel de Administração"
                >
                  <ShieldCheckIcon className="h-5 w-5" />
                  Admin
                </Link>
              )}

              <button
                type="button"
                onClick={handleSignOut}
                className="button-red"
              >
                Desconectar
              </button>
            </div>
          </div>
        </div>

        {/* Modal de Foto */}
        {isModalOpen && profile.photo && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          >
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-3 right-3 p-2 bg-black/20 backdrop-blur-[0.2rem] hover:ring-cyan-300/60 ring-2 ring-white/10 rounded-full transition-colors duration-200 shadow-lg z-10"
                aria-label="Fechar"
              >
                <XMarkIcon className="h-4 w-4 text-white" />
              </button>

              <Image
                src={profile.photo}
                alt="Foto de perfil"
                className="max-h-[80vh] max-w-[90vw] w-auto h-auto rounded-xl object-contain"
                width={1200}
                height={1200}
              />
            </div>
          </div>
        )}
        <div className="glassmorphism-pill w-full p-6 rounded-4xl flex flex-col items-start gap-4 text-right md:text-left">
          <p className="text-xl mb-2">Informações da Conta</p>
          {verificationMessage && (
            <div className="rounded-full backdrop-blur-sm bg-green-500/20 border border-green-400/30 p-4 w-full">
              <p className="text-sm font-medium text-green-200">
                {verificationMessage}
              </p>
            </div>
          )}
          {verificationError && (
            <div className="rounded-full backdrop-blur-sm bg-red-500/20 border border-red-400/30 p-4 w-full">
              <p className="text-sm font-medium text-red-200">
                {verificationError}
              </p>
            </div>
          )}
          <div className="flex flex-col md:flex-row gap-1 md:gap-2 items-start">
            <p>UID: </p>
            <p>{user?.uid ?? '-'}</p>
          </div>
          <div className="flex flex-col md:flex-row gap-1 md:gap-2 items-start md:items-center justify-between w-full">
            <div className="flex flex-col md:flex-row gap-1 md:gap-2 items-start md:items-center justify-center">
              <p>Email verificado: </p>
              <p>{emailVerifiedLabel}</p>
            </div>
            {!user?.emailVerified && (
              <button
                type="button"
                onClick={handleSendVerificationEmail}
                disabled={isSendingVerification}
                className="button-cyan text-sm mt-2 md:mt-0 w-fit"
              >
                {isSendingVerification ? 'Enviando...' : 'Enviar Verificação'}
              </button>
            )}
          </div>
          <div className="flex flex-col md:flex-row gap-1 md:gap-2 items-center justify-start">
            <p>Conta criada em: </p>
            <p>{formatDate(createdAt)}</p>
          </div>
        </div>
      </div>
    </main>
  )
}
