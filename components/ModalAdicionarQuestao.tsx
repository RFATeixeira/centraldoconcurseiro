'use client'

import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface ModalAdicionarQuestaoProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface FormQuestao {
  enunciado: string
  opcaoA: string
  opcaoB: string
  opcaoC: string
  opcaoD: string
  opcaoE: string
  resposta: string
  explicacao: string
  banca: string
  concurso: string
  disciplina: string
  ano: number
  dificuldade: 'facil' | 'media' | 'dificil'
}

const emptyForm: FormQuestao = {
  enunciado: '',
  opcaoA: '',
  opcaoB: '',
  opcaoC: '',
  opcaoD: '',
  opcaoE: '',
  resposta: 'A',
  explicacao: '',
  banca: '',
  concurso: '',
  disciplina: '',
  ano: new Date().getFullYear(),
  dificuldade: 'media',
}

export default function ModalAdicionarQuestao({
  isOpen,
  onClose,
}: ModalAdicionarQuestaoProps) {
  const [form, setForm] = useState<FormQuestao>(emptyForm)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleInputChange = (
    field: keyof FormQuestao,
    value: string | number,
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      // Validar campos obrigatórios
      if (
        !form.enunciado.trim() ||
        !form.opcaoA.trim() ||
        !form.opcaoB.trim() ||
        !form.opcaoC.trim() ||
        !form.opcaoD.trim() ||
        !form.resposta ||
        !form.explicacao.trim() ||
        !form.banca.trim() ||
        !form.concurso.trim() ||
        !form.disciplina.trim()
      ) {
        setError('Preencha todos os campos obrigatórios')
        setIsLoading(false)
        return
      }

      // Construir objeto de opções
      const opcoes: Record<string, string> = {
        a: form.opcaoA.trim(),
        b: form.opcaoB.trim(),
        c: form.opcaoC.trim(),
        d: form.opcaoD.trim(),
      }

      if (form.opcaoE.trim()) {
        opcoes.e = form.opcaoE.trim()
      }

      // Adicionar questão
      await addDoc(collection(db, 'questoes'), {
        enunciado: form.enunciado.trim(),
        opcoes,
        resposta: form.resposta.toUpperCase(),
        explicacao: form.explicacao.trim(),
        banca: form.banca.trim(),
        concurso: form.concurso.trim(),
        disciplina: form.disciplina.trim(),
        ano: form.ano,
        dificuldade: form.dificuldade,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      setSuccess('✅ Questão adicionada com sucesso! Adicione mais ou feche.')
      setForm(emptyForm)

      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err) {
      console.error('Erro ao adicionar questão:', err)
      setError('Erro ao adicionar questão. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-250 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => {
        setForm(emptyForm)
        setError(null)
        setSuccess(null)
        onClose()
      }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] bg-slate-800/60 border border-slate-700/50 rounded-3xl relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            setForm(emptyForm)
            setError(null)
            setSuccess(null)
            onClose()
          }}
          className="close-button"
          aria-label="Fechar"
        >
          <XMarkIcon className="h-4 w-4 text-white" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-auto flex-1 p-6 chat-scrollbar">
          {/* Header */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-cyan-300">
              Adicionar Questão
            </h2>
          </div>

          {error && (
            <div className="rounded-lg backdrop-blur-sm bg-red-500/20 border border-red-400/30 p-3 mb-4">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-lg backdrop-blur-sm bg-green-500/20 border border-green-400/30 p-3 mb-4">
              <p className="text-sm text-green-200">{success}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Enunciado */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">
                Enunciado *
              </label>
              <textarea
                value={form.enunciado}
                onChange={(e) => handleInputChange('enunciado', e.target.value)}
                placeholder="Digite o texto da questão"
                className="input-style-1 rounded-3xl w-full min-h-20"
                disabled={isLoading}
              />
            </div>

            {/* Opções */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">
                Opções *
              </label>
              <div className="space-y-2">
                {['A', 'B', 'C', 'D', 'E'].map((letra) => (
                  <input
                    key={letra}
                    type="text"
                    value={form[`opcao${letra}` as keyof FormQuestao]}
                    onChange={(e) =>
                      handleInputChange(
                        `opcao${letra}` as keyof FormQuestao,
                        e.target.value,
                      )
                    }
                    placeholder={`Opção ${letra}${letra !== 'E' ? ' *' : ''}`}
                    className="input-style-1 w-full"
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>

            {/* Resposta */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">
                Resposta Correta *
              </label>
              <select
                value={form.resposta}
                onChange={(e) => handleInputChange('resposta', e.target.value)}
                className="input-style-1 w-full"
                disabled={isLoading}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
              </select>
            </div>

            {/* Explicação */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">
                Explicação *
              </label>
              <textarea
                value={form.explicacao}
                onChange={(e) =>
                  handleInputChange('explicacao', e.target.value)
                }
                placeholder="Explicação detalhada da resposta"
                className="input-style-1 rounded-3xl w-full min-h-20"
                disabled={isLoading}
              />
            </div>

            {/* Banca */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">
                Banca *
              </label>
              <input
                type="text"
                value={form.banca}
                onChange={(e) => handleInputChange('banca', e.target.value)}
                placeholder="Ex: CESPE, VUNESP, FCC"
                className="input-style-1 w-full"
                disabled={isLoading}
              />
            </div>

            {/* Concurso */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">
                Concurso *
              </label>
              <input
                type="text"
                value={form.concurso}
                onChange={(e) => handleInputChange('concurso', e.target.value)}
                placeholder="Ex: INSS 2022, Polícia Federal 2023"
                className="input-style-1 w-full"
                disabled={isLoading}
              />
            </div>

            {/* Disciplina */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">
                Disciplina *
              </label>
              <input
                type="text"
                value={form.disciplina}
                onChange={(e) =>
                  handleInputChange('disciplina', e.target.value)
                }
                placeholder="Ex: Português, Matemática"
                className="input-style-1 w-full"
                disabled={isLoading}
              />
            </div>

            {/* Ano e Dificuldade */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">
                  Ano *
                </label>
                <input
                  type="number"
                  value={form.ano}
                  onChange={(e) =>
                    handleInputChange('ano', parseInt(e.target.value))
                  }
                  className="input-style-1 w-full"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">
                  Dificuldade *
                </label>
                <select
                  value={form.dificuldade}
                  onChange={(e) =>
                    handleInputChange(
                      'dificuldade',
                      e.target.value as 'facil' | 'media' | 'dificil',
                    )
                  }
                  className="input-style-1 w-full"
                  disabled={isLoading}
                >
                  <option value="facil">Fácil</option>
                  <option value="media">Média</option>
                  <option value="dificil">Difícil</option>
                </select>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4 flex-col md:flex-row">
              <button
                type="submit"
                disabled={isLoading}
                className="button-cyan flex-1"
              >
                {isLoading ? 'Adicionando...' : '+ Adicionar Questão'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
