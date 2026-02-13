'use client'

import { useEffect, useState } from 'react'
import { TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/solid'
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../../../lib/firebase'

interface Questao {
  id: string
  enunciado: string
  opcoes: Record<string, string>
  resposta: string
  banca: string
  concurso: string
  disciplina: string
  ano: number
  conjunto?: string // campo opcional para agrupar
}

export default function LotesQuestoesPage() {
  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [grupoSelecionado, setGrupoSelecionado] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Questao>>({})

  async function fetchQuestoes() {
    setLoading(true)
    setError(null)
    try {
      const snap = await getDocs(collection(db, 'questoes'))
      const data: Questao[] = []
      snap.forEach((docSnap) => {
        const d = docSnap.data()
        data.push({
          id: docSnap.id,
          enunciado: d.enunciado,
          opcoes: d.opcoes,
          resposta: d.resposta,
          banca: d.banca,
          concurso: d.concurso,
          disciplina: d.disciplina,
          ano: d.ano,
          conjunto: d.conjunto || 'Sem grupo',
        })
      })
      setQuestoes(data)
    } catch (err) {
      setError('Erro ao buscar questões: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuestoes()
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja deletar esta questão?')) return
    await deleteDoc(doc(db, 'questoes', id))
    setQuestoes((qs) => qs.filter((q) => q.id !== id))
  }

  async function handleDeleteGrupo(grupo: string) {
    if (!confirm(`Deletar todas as questões do grupo "${grupo}"?`)) return
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'questoes'))
      const batch = [] as Promise<void>[]
      snap.forEach((docSnap) => {
        const d = docSnap.data()
        if ((d.conjunto || 'Sem grupo') === grupo) {
          batch.push(deleteDoc(doc(db, 'questoes', docSnap.id)))
        }
      })
      await Promise.all(batch)
      setQuestoes((qs) => qs.filter((q) => q.conjunto !== grupo))
      setGrupoSelecionado(null)
    } catch (err) {
      setError('Erro ao deletar grupo: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function startEdit(q: Questao) {
    setEditId(q.id)
    setEditData(q)
  }

  function cancelEdit() {
    setEditId(null)
    setEditData({})
  }

  async function saveEdit() {
    if (!editId) return
    await updateDoc(doc(db, 'questoes', editId), {
      ...editData,
    })
    setQuestoes((qs) =>
      qs.map((q) => (q.id === editId ? ({ ...q, ...editData } as Questao) : q)),
    )
    setEditId(null)
    setEditData({})
  }

  // Agrupar questões por conjunto
  const grupos = Array.from(
    new Set(questoes.map((q) => q.conjunto || 'Sem grupo')),
  )

  return (
    <div className="max-w-5xl mx-auto p-4 relative z-300 b">
      <h1 className="text-2xl font-bold text-white mb-6">
        Gerenciar Questões em Lote
      </h1>
      {loading && <p className="text-slate-300">Carregando questões...</p>}
      {error && <p className="text-red-400">{error}</p>}
      {!loading && grupos.length === 0 ? (
        <div className="text-slate-400 text-center py-12 text-lg">
          Nenhum grupo encontrado.
        </div>
      ) : grupoSelecionado === null ? (
        <div>
          <h2 className="text-xl text-white mb-4">Selecione um grupo:</h2>
          <ul className="space-y-2">
            {grupos.map((grupo) => (
              <li
                key={grupo}
                className="glassmorphism-pill rounded-3xl flex items-center gap-4 p-4 hover:ring-cyan-600 transition-all hover:shadow-lg hover:shadow-cyan-700 cursor-pointer"
                onClick={() => setGrupoSelecionado(grupo)}
                title="Editar questões do grupo"
              >
                <span className="text-cyan-400 underline text-lg font-semibold">
                  {grupo}
                </span>
                <span className="text-slate-400 text-sm">
                  (
                  {
                    questoes.filter(
                      (q) => (q.conjunto || 'Sem grupo') === grupo,
                    ).length
                  }{' '}
                  questões)
                </span>
                <button
                  className="button-red-real w-fit ml-auto flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteGrupo(grupo)
                  }}
                  title="Deletar grupo"
                >
                  <TrashIcon className="h-5 w-5 text-red-400" />
                  <span>Deletar grupo</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>
          <button
            className="mb-4 text-cyan-400 underline flex items-center gap-1"
            onClick={() => setGrupoSelecionado(null)}
          >
            <ArrowLeftIcon className="h-5 w-5 inline text-cyan-400" />
            <span>Voltar para grupos</span>
          </button>
          <div className="space-y-6">
            {questoes
              .filter((q) => (q.conjunto || 'Sem grupo') === grupoSelecionado)
              .map((q) => (
                <div
                  key={q.id}
                  className="bg-slate-800/20 backdrop-blur rounded-xl p-6 border border-slate-700/30 space-y-4"
                >
                  {editId === q.id ? (
                    <>
                      {/* ENUNCIADO */}
                      <div>
                        <label className="text-cyan-400 font-semibold">
                          Enunciado
                        </label>
                        <input
                          className="input-style-1"
                          value={editData.enunciado || ''}
                          onChange={(e) =>
                            setEditData((d) => ({
                              ...d,
                              enunciado: e.target.value,
                            }))
                          }
                        />
                      </div>

                      {/* ALTERNATIVAS */}
                      <div>
                        <label className="text-cyan-400 font-semibold">
                          Alternativas
                        </label>
                        <div className="space-y-2 mt-2">
                          {Object.entries(q.opcoes).map(([letra, texto]) => (
                            <div
                              key={letra}
                              className="flex items-center gap-2"
                            >
                              <span className="font-bold text-cyan-300">
                                {letra.toUpperCase()}:
                              </span>
                              <input
                                className="input-style-1"
                                value={editData.opcoes?.[letra] ?? texto}
                                onChange={(e) =>
                                  setEditData((d) => ({
                                    ...d,
                                    opcoes: {
                                      ...d.opcoes,
                                      [letra]: e.target.value,
                                    },
                                  }))
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* CAMPOS SIMPLES */}
                      {(
                        [
                          'resposta',
                          'banca',
                          'concurso',
                          'disciplina',
                          'ano',
                        ] as (keyof Questao)[]
                      ).map((campo) => (
                        <div key={campo}>
                          <label className="text-cyan-400 font-semibold capitalize">
                            {campo}
                          </label>
                          <input
                            className="input-style-1"
                            value={
                              typeof editData[campo] === 'string' ||
                              typeof editData[campo] === 'number'
                                ? editData[campo]
                                : ''
                            }
                            onChange={(e) =>
                              setEditData((d) => ({
                                ...d,
                                [campo]:
                                  campo === 'ano'
                                    ? Number(e.target.value)
                                    : e.target.value,
                              }))
                            }
                          />
                        </div>
                      ))}

                      {/* BOTÕES */}
                      <div className="flex gap-3 pt-2">
                        <button className="button-cyan" onClick={saveEdit}>
                          Salvar
                        </button>
                        <button
                          className="button-red-real"
                          onClick={cancelEdit}
                        >
                          Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* ENUNCIADO */}
                      <div>
                        <h3 className="text-cyan-400 font-semibold">
                          Enunciado
                        </h3>
                        <p className="mt-1">{q.enunciado}</p>
                      </div>

                      {/* ALTERNATIVAS */}
                      <div>
                        <h3 className="text-cyan-400 font-semibold">
                          Alternativas
                        </h3>
                        <div className="mt-2 space-y-1">
                          {Object.entries(q.opcoes).map(([letra, texto]) => (
                            <div key={letra}>
                              <span className="font-bold text-cyan-300 mr-1">
                                {letra.toUpperCase()}:
                              </span>
                              {texto}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* METADADOS */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-cyan-400 font-semibold">
                            Resposta:
                          </span>{' '}
                          {q.resposta}
                        </div>
                        <div>
                          <span className="text-cyan-400 font-semibold">
                            Ano:
                          </span>{' '}
                          {q.ano}
                        </div>
                        <div>
                          <span className="text-cyan-400 font-semibold">
                            Banca:
                          </span>{' '}
                          {q.banca}
                        </div>
                        <div>
                          <span className="text-cyan-400 font-semibold">
                            Concurso:
                          </span>{' '}
                          {q.concurso}
                        </div>
                        <div>
                          <span className="text-cyan-400 font-semibold">
                            Disciplina:
                          </span>{' '}
                          {q.disciplina}
                        </div>
                      </div>

                      {/* AÇÕES */}
                      <div className="flex gap-3 pt-4">
                        <button
                          className="button-cyan"
                          onClick={() => startEdit(q)}
                        >
                          Editar
                        </button>
                        <button
                          className="button-red-real"
                          onClick={() => handleDelete(q.id)}
                        >
                          Deletar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
