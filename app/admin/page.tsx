'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'

import ModalAdicionarQuestao from '../../components/ModalAdicionarQuestao'
import UploadQuestoes from '../../components/UploadQuestoes'
import UploadClassificacoes from '../../components/UploadClassificacoes'
import { PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function AdminPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [isModalQuestionOpen, setIsModalQuestionOpen] = useState(false)
  const [isModalUploadOpen, setIsModalUploadOpen] = useState(false)

  const [isModalClassificacoesOpen, setIsModalClassificacoesOpen] =
    useState(false)

  useEffect(() => {
    if (loading) return

    // Verifica se usuário está autenticado e é admin
    if (!user) {
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
    <main className="w-full min-h-full flex flex-col p-4 pb-24 md:pb-4 gap-6 pt-4 md:pt-24">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div>
          <p className="text-lg text-white font-semibold">
            Gerencie questões de simulados e classificações de concursos
          </p>
        </div>
        {/* Cards Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Card 1: Adicionar Questões */}
          <div className="glassmorphism-pill rounded-3xl flex flex-col p-6 hover:ring-cyan-600 transition-all">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-cyan-500/20 rounded-xl">
                <PencilSquareIcon className="h-6 w-6 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white">
                  Adicionar Questões
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Escolha como adicionar: manual ou em lote
                </p>
              </div>
            </div>
            {/* Botões de Ação */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setIsModalQuestionOpen(true)}
                className="button-cyan justify-center items-center"
              >
                ✏️ Questão Manual
              </button>
              <button
                onClick={() => setIsModalUploadOpen(true)}
                className="button-red justify-center items-center"
              >
                📄 CSV ou JSON
              </button>
            </div>
          </div>
          {/* Card 2: Upload Classificações */}
          <div className="glassmorphism-pill rounded-3xl flex flex-col p-6 hover:ring-cyan-600 transition-all">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-cyan-500/20 rounded-xl">
                <span className="text-2xl">🏆</span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white">
                  Upload de Classificações
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Importe classificações de concursos em lote
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsModalClassificacoesOpen(true)}
              className="button-cyan justify-center items-center"
            >
              🏆 Importar Classificação
            </button>
          </div>
        </div>
        <div className="mt-8 z-150">
          <Link href="/admin/lotes-questoes" className="button-cyan">
            Gerenciar Lotes de Questões
          </Link>
        </div>
      </div>

      {/* Modal Adicionar Questão */}
      <ModalAdicionarQuestao
        isOpen={isModalQuestionOpen}
        onClose={() => setIsModalQuestionOpen(false)}
        onSuccess={() => {
          // Atualizar se necessário
        }}
      />

      {/* Modal Upload Questões */}
      {isModalUploadOpen && (
        <div
          className="fixed inset-0 z-250 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setIsModalUploadOpen(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] bg-slate-800/60 border border-slate-700/50 rounded-3xl relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsModalUploadOpen(false)}
              className="close-button"
              aria-label="Fechar"
            >
              <XMarkIcon className="h-4 w-4 text-white" />
            </button>
            {/* Scrollable Content */}
            <div className="overflow-auto flex-1 p-6 chat-scrollbar">
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-cyan-300">
                  Upload de Questões em Lote
                </h2>
              </div>
              {/* Content */}
              <UploadQuestoes />
            </div>
          </div>
        </div>
      )}

      {/* Modal Upload Classificações */}
      {isModalClassificacoesOpen && (
        <div
          className="fixed inset-0 z-250 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setIsModalClassificacoesOpen(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] bg-slate-800/60 border border-slate-700/50 rounded-3xl relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsModalClassificacoesOpen(false)}
              className="close-button"
              aria-label="Fechar"
            >
              <XMarkIcon className="h-4 w-4 text-white" />
            </button>

            {/* Scrollable Content */}
            <div className="overflow-auto flex-1 p-6 chat-scrollbar">
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-cyan-300">
                  Upload de Classificações
                </h2>
              </div>

              {/* Content */}
              <UploadClassificacoes />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
