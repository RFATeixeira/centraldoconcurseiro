'use client'

import { useCallback, useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db, auth } from '../../lib/firebase'
import { useAuth } from '../context/AuthContext'

export default function DiagnosticoPage() {
  const { user } = useAuth()
  const [resultado, setResultado] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const pause = () => new Promise((resolve) => setTimeout(resolve, 0))

  const withTimeout = async <T,>(
    promise: Promise<T>,
    ms: number,
    label: string,
  ) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`${label} timeout after ${ms}ms`))
      }, ms)
    })

    try {
      return await Promise.race([promise, timeoutPromise])
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }

  const runTest = useCallback(async () => {
    setLoading(true)
    setResultado('🔄 Testando conexão...\n')
    await pause()

    try {
      if (!user) {
        setResultado((prev) => prev + '❌ Usuário não autenticado\n')
        return
      }

      // 1. Verificar autenticação
      setResultado((prev) => prev + '✅ Usuário autenticado\n')
      setResultado(
        (prev) => prev + `   Email: ${user?.email}\n   UID: ${user?.uid}\n\n`,
      )
      await pause()

      // 2. Forçar refresh do token
      setResultado((prev) => prev + '🔄 Atualizando token...\n')
      await pause()
      const token = await withTimeout(
        user.getIdToken(true),
        10000,
        'Token refresh',
      )
      setResultado((prev) => prev + `✅ Token obtido\n`)
      setResultado(
        (prev) => prev + `   Primeiros chars: ${token.substring(0, 30)}...\n\n`,
      )
      await pause()

      // 3. Testar leitura de usuários
      setResultado((prev) => prev + '🔄 Testando leitura de users...\n')
      await pause()
      const usersSnapshot = await withTimeout(
        getDocs(collection(db, 'users')),
        10000,
        'Users read',
      )
      setResultado(
        (prev) =>
          prev + `✅ Leitura de users OK: ${usersSnapshot.size} docs\n\n`,
      )
      await pause()

      // 4. Testar leitura de chats
      setResultado((prev) => prev + '🔄 Testando leitura de chats...\n')
      await pause()
      const chatsSnapshot = await withTimeout(
        getDocs(collection(db, 'chats')),
        10000,
        'Chats read',
      )
      setResultado(
        (prev) =>
          prev + `✅ Leitura de chats OK: ${chatsSnapshot.size} docs\n\n`,
      )
      await pause()

      // 5. Estado final do auth
      setResultado((prev) => prev + '📊 Estado do Firebase Auth:\n')
      const currentUser = auth.currentUser
      setResultado(
        (prev) =>
          prev +
          `   Autenticado: ${!!currentUser}\n` +
          `   Email verificado: ${currentUser?.emailVerified}\n` +
          `   Último sign-in: ${currentUser?.metadata.lastSignInTime}\n\n`,
      )

      setResultado((prev) => prev + '✅ TODOS OS TESTES PASSARAM!\n')
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      const errorCode =
        error && typeof error === 'object' && 'code' in error
          ? (error as { code: string }).code
          : 'unknown'
      setResultado((prev) => prev + `\n❌ ERRO:\n`)
      setResultado((prev) => prev + `   Tipo: ${errorCode}\n`)
      setResultado((prev) => prev + `   Mensagem: ${err.message}\n`)
      setResultado(
        (prev) => prev + `   Stack: ${err.stack?.substring(0, 200)}...\n`,
      )
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      runTest()
    }
  }, [user, runTest])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white">Não autenticado. Faça login primeiro.</p>
      </div>
    )
  }

  const handleTest = () => {
    runTest()
  }

  return (
    <div className="relative z-10 min-h-screen p-4 md:p-8 pt-24 md:pt-28">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">
          🔧 Diagnóstico do Firestore
        </h1>

        <div className="bg-slate-800 rounded-lg p-6 mb-4">
          <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
            {resultado || 'Aguardando...'}
          </pre>
        </div>

        <button
          onClick={handleTest}
          disabled={loading}
          className="button-cyan px-6 py-3"
        >
          {loading ? 'Testando...' : '🔄 Testar Novamente'}
        </button>

        <div className="mt-6 bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">📋 Instruções</h2>
          <div className="text-slate-300 space-y-2">
            <p>
              <strong>Se ver &quot;permission-denied&quot;:</strong>
            </p>
            <ol className="list-decimal ml-6 space-y-1">
              <li>Vá ao Firebase Console</li>
              <li>Firestore Database → Rules</li>
              <li>Copie as regras de firestore.rules do projeto</li>
              <li>Cole e publique</li>
              <li>Aguarde 1-2 minutos</li>
              <li>Teste novamente aqui</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
