'use client'

import { useEffect, useState } from 'react'
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
    <div className="max-w-5xl mx-auto p-4 relative z-300 bg-slate-900/90 rounded-xl">
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
                className="flex items-center gap-4 bg-slate-800/60 rounded-lg p-4"
              >
                <button
                  className="text-cyan-400 underline text-lg font-semibold"
                  onClick={() => setGrupoSelecionado(grupo)}
                >
                  {grupo}
                </button>
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
                  className="button-red-real ml-auto"
                  onClick={() => handleDeleteGrupo(grupo)}
                >
                  Deletar grupo
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>
          <button
            className="mb-4 text-cyan-400 underline"
            onClick={() => setGrupoSelecionado(null)}
          >
            ← Voltar para grupos
          </button>
          <table className="min-w-full text-sm text-left text-slate-300 bg-slate-800 rounded-xl overflow-hidden">
            <thead>
              <tr>
                <th className="p-2">Enunciado</th>
                <th className="p-2">Alternativas</th>
                <th className="p-2">Resposta</th>
                <th className="p-2">Banca</th>
                <th className="p-2">Concurso</th>
                <th className="p-2">Disciplina</th>
                <th className="p-2">Ano</th>
                <th className="p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {questoes
                .filter((q) => (q.conjunto || 'Sem grupo') === grupoSelecionado)
                .map((q) => (
                  <tr key={q.id} className="border-b border-slate-700/30">
                    {editId === q.id ? (
                      <>
                        <td className="p-2">
                          <input
                            className="w-full bg-slate-900 text-white"
                            value={editData.enunciado || ''}
                            onChange={(e) =>
                              setEditData((d) => ({
                                ...d,
                                enunciado: e.target.value,
                              }))
                            }
                          />
                        </td>
                        <td className="p-2">
                          {Object.entries(q.opcoes).map(([letra, texto]) => (
                            <div key={letra} className="mb-1">
                              <span className="font-bold text-cyan-300 mr-1">
                                {letra.toUpperCase()}:
                              </span>
                              <input
                                className="bg-slate-900 text-white"
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
                        </td>
                        <td className="p-2">
                          <input
                            className="w-12 bg-slate-900 text-white"
                            value={editData.resposta || ''}
                            onChange={(e) =>
                              setEditData((d) => ({
                                ...d,
                                resposta: e.target.value,
                              }))
                            }
                          />
                        </td>
                        <td className="p-2">
                          <input
                            className="w-24 bg-slate-900 text-white"
                            value={editData.banca || ''}
                            onChange={(e) =>
                              setEditData((d) => ({
                                ...d,
                                banca: e.target.value,
                              }))
                            }
                          />
                        </td>
                        <td className="p-2">
                          <input
                            className="w-24 bg-slate-900 text-white"
                            value={editData.concurso || ''}
                            onChange={(e) =>
                              setEditData((d) => ({
                                ...d,
                                concurso: e.target.value,
                              }))
                            }
                          />
                        </td>
                        <td className="p-2">
                          <input
                            className="w-24 bg-slate-900 text-white"
                            value={editData.disciplina || ''}
                            onChange={(e) =>
                              setEditData((d) => ({
                                ...d,
                                disciplina: e.target.value,
                              }))
                            }
                          />
                        </td>
                        <td className="p-2">
                          <input
                            className="w-16 bg-slate-900 text-white"
                            value={editData.ano || ''}
                            onChange={(e) =>
                              setEditData((d) => ({
                                ...d,
                                ano: Number(e.target.value),
                              }))
                            }
                          />
                        </td>
                        <td className="p-2 space-x-2">
                          <button
                            className="bg-green-700 px-3 py-1 rounded"
                            onClick={saveEdit}
                          >
                            Salvar
                          </button>
                          <button
                            className="bg-slate-700 px-3 py-1 rounded"
                            onClick={cancelEdit}
                          >
                            Cancelar
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2">{q.enunciado.slice(0, 40)}...</td>
                        <td className="p-2">
                          {Object.entries(q.opcoes).map(([letra, texto]) => (
                            <div key={letra}>
                              <span className="font-bold text-cyan-300 mr-1">
                                {letra.toUpperCase()}:
                              </span>
                              {texto}
                            </div>
                          ))}
                        </td>
                        <td className="p-2">{q.resposta}</td>
                        <td className="p-2">{q.banca}</td>
                        <td className="p-2">{q.concurso}</td>
                        <td className="p-2">{q.disciplina}</td>
                        <td className="p-2">{q.ano}</td>
                        <td className="p-2 space-x-2">
                          <button
                            className="bg-yellow-700 px-3 py-1 rounded"
                            onClick={() => startEdit(q)}
                          >
                            Editar
                          </button>
                          <button
                            className="bg-red-700 px-3 py-1 rounded"
                            onClick={() => handleDelete(q.id)}
                          >
                            Deletar
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
