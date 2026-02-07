'use client'

import { useEffect, useState } from 'react'
import { useHeader } from '../context/HeaderContext'
import { useAuth } from '../context/AuthContext'
import Link from 'next/link'
import Image from 'next/image'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const { hideHeader, showHeaderAgain } = useHeader()
  const { signInWithEmail } = useAuth()
  const router = useRouter()
  const [cpfOrEmail, setCpfOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    hideHeader()
    return () => {
      showHeaderAgain()
    }
  }, [hideHeader, showHeaderAgain])

  const resolveEmailFromCpf = async (cpfOrEmailValue: string) => {
    if (cpfOrEmailValue.includes('@')) {
      return cpfOrEmailValue
    }

    const cpfDigits = cpfOrEmailValue.replace(/\D/g, '')
    if (!cpfDigits) {
      throw new Error('Informe um CPF valido ou um email.')
    }

    const snapshot = await getDoc(doc(db, 'cpf_index', cpfDigits))

    if (!snapshot.exists()) {
      throw new Error('CPF nao encontrado.')
    }

    const userData = snapshot.data()
    if (!userData?.email) {
      throw new Error('Email nao encontrado para este CPF.')
    }

    return String(userData.email)
  }

  const getAuthErrorMessage = (errorValue: unknown) => {
    if (typeof errorValue !== 'object' || !errorValue) {
      return 'Erro ao autenticar. Tente novamente.'
    }

    const code = (errorValue as { code?: string }).code
    switch (code) {
      case 'auth/invalid-email':
        return 'Email invalido.'
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Credenciais invalidas.'
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Tente novamente mais tarde.'
      default:
        return 'Erro ao autenticar. Tente novamente.'
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const email = await resolveEmailFromCpf(cpfOrEmail.trim())
      await signInWithEmail(email, password)
      router.replace('/')
    } catch (errorValue) {
      setError(getAuthErrorMessage(errorValue))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="w-full min-h-full flex p-4 items-center justify-center">
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-right md:text-center">
          <Image
            src="/logo-centraldoconcurseiro.png"
            alt="Detona Concurseiro"
            width={100}
            height={100}
            className="ml-auto md:mx-auto mb-4"
          ></Image>
          <h2 className="text-3xl font-bold text-white drop-shadow-lg">
            Acesse sua conta
          </h2>
          <p className="mt-2 text-sm text-cyan-200">
            Ou{' '}
            <Link
              href="/register"
              className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              crie uma nova conta
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg backdrop-blur-sm bg-red-500/20 border border-red-400/30 p-4">
              <div className="text-sm font-medium text-red-200">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="cpf-or-email"
                className="text-xs font-semibold text-cyan-400 uppercase tracking-wide mb-2 block"
              >
                CPF ou Email
              </label>
              <input
                id="cpf-or-email"
                name="cpf-or-email"
                type="text"
                required
                className="input-style-1"
                placeholder="CPF ou Email"
                value={cpfOrEmail}
                onChange={(e) => setCpfOrEmail(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="text-xs font-semibold text-cyan-400 uppercase tracking-wide mb-2 block"
              >
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input-style-1"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button type="submit" disabled={isLoading} className="button-cyan">
              {isLoading ? 'Conectando...' : 'Conectar'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
