'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import UploadClassificacoes from '../../components/UploadClassificacoes'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function AdminPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    // Verifica se usuário está autenticado e é admin
    if (!user) {
      router.replace('/login')
      return
    }

    if (!profile?.isAdmin) {
      router.replace('/')
    }
  }, [user, profile, loading, router])

  // Mostra loading enquanto verifica autorização
  if (loading || !user) {
    return (
      <main className="w-full min-h-full flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-400">Verificando autorização...</p>
        </div>
      </main>
    )
  }

  // Não é admin - o effect cuidará do redirect
  if (!profile?.isAdmin) {
    return null
  }

  return (
    <main className="w-full min-h-full flex p-4 pb-24 md:pb-4">
      <div className="w-full max-w-4xl mx-auto z-100">
        {/* Header */}
        <div className="mb-4 text-right md:text-left">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-cyan-200 hover:text-cyan-100 transition-colors mb-4 text-sm"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Voltar
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Painel Admin</h1>
          <p className="text-gray-400 text-sm">Gerencie dados de concursos</p>
        </div>

        {/* Conteúdo Admin */}
        <div className="glassmorphism-pill rounded-4xl p-8 flex flex-col">
          <div className="mb-8 text-right md:text-left">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Upload de Classificações
            </h2>
            <p className="text-gray-300 mb-6">
              Envie uma planilha com os dados de classificação do concurso. O
              sistema interpretará automaticamente os dados.
            </p>
          </div>

          <UploadClassificacoes />
        </div>
      </div>
    </main>
  )
}
