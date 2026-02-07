'use client'

import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface ModalAdicionarConcursoProps {
  concurso: { nome: string }
  onConfirm: (numeroInscricao: string) => Promise<void>
  onClose: () => void
}

export default function ModalAdicionarConcurso({
  concurso,
  onConfirm,
  onClose,
}: ModalAdicionarConcursoProps) {
  const [numeroInscricao, setNumeroInscricao] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!numeroInscricao.trim()) {
      setError('Informe o número de inscrição')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onConfirm(numeroInscricao)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao adicionar concurso',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-150">
      <div className="glassmorphism-pill rounded-3xl p-6 flex flex-col relative">
        {/* Close Button */}
        <button onClick={onClose} className="close-button" aria-label="Fechar">
          <XMarkIcon className="h-4 w-4 text-white" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-2">{concurso.nome}</h2>
        <p className="text-gray-400 text-sm mb-6">
          Informe seu número de inscrição para adicionar este concurso
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Número de Inscrição *
            </label>
            <input
              type="text"
              value={numeroInscricao}
              onChange={(e) => setNumeroInscricao(e.target.value)}
              placeholder="Digite seu número de inscrição"
              className="input-style-1 w-full"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Será usado para encontrar sua classificação exata
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="button-cyan flex-1"
            >
              {loading ? 'Adicionando...' : 'Adicionar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="button-red flex-1"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
