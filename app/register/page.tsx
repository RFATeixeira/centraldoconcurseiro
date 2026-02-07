'use client'

import { useEffect, useState } from 'react'
import { useHeader } from '../context/HeaderContext'
import { useAuth } from '../context/AuthContext'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function Register() {
  const { hideHeader, showHeaderAgain } = useHeader()
  const { signUpWithEmail } = useAuth()
  const router = useRouter()
  const [cpf, setCpf] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    hideHeader()
    return () => {
      showHeaderAgain()
    }
  }, [hideHeader, showHeaderAgain])

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(e.target.value)
    setValidationError('')
  }

  const getAuthErrorMessage = (errorValue: unknown) => {
    if (typeof errorValue !== 'object' || !errorValue) {
      return 'Erro ao criar conta. Tente novamente.'
    }

    const code = (errorValue as { code?: string }).code
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Email ja cadastrado.'
      case 'auth/invalid-email':
        return 'Email invalido.'
      case 'auth/weak-password':
        return 'A senha deve ter pelo menos 6 caracteres.'
      case 'permission-denied':
        return 'Permissao negada ao salvar seus dados. Fale com o suporte.'
      case 'unavailable':
        return 'Servico temporariamente indisponivel. Tente novamente.'
      default:
        return 'Erro ao criar conta. Tente novamente.'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setValidationError('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setValidationError('As senhas não correspondem')
      return
    }

    // Validate password length
    if (password.length < 6) {
      setValidationError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    const cpfDigits = cpf.replace(/\D/g, '')
    if (cpfDigits.length !== 11) {
      setValidationError('CPF invalido')
      return
    }

    setIsLoading(true)
    try {
      await signUpWithEmail(email.trim(), password, cpf.trim())
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
          />
          <h2 className="text-3xl font-bold text-white drop-shadow-lg">
            Crie sua conta
          </h2>
          <p className="mt-2 text-sm text-cyan-200">
            Ou{' '}
            <Link
              href="/login"
              className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              acesse sua conta existente
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {(error || validationError) && (
            <div className="rounded-lg backdrop-blur-sm bg-red-500/20 border border-red-400/30 p-4">
              <div className="text-sm font-medium text-red-200">
                {validationError || error}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="cpf"
                className="text-xs font-semibold text-cyan-400 uppercase tracking-wide mb-2 block"
              >
                CPF
              </label>
              <input
                id="cpf"
                name="cpf"
                type="text"
                required
                className="input-style-1"
                placeholder="CPF (000.000.000-00)"
                value={cpf}
                onChange={handleCPFChange}
                maxLength={14}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="text-xs font-semibold text-cyan-400 uppercase tracking-wide mb-2 block"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input-style-1"
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setValidationError('')
                }}
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
                onChange={(e) => {
                  setPassword(e.target.value)
                  setValidationError('')
                }}
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="text-xs font-semibold text-cyan-400 uppercase tracking-wide mb-2 block"
              >
                Confirmar Senha
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                className="input-style-1"
                placeholder="Confirmar Senha"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setValidationError('')
                }}
              />
            </div>
          </div>

          <div>
            <button type="submit" disabled={isLoading} className="button-cyan">
              {isLoading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
