'use client'

import React, { useEffect, useState } from 'react'
import {
  collection,
  query,
  addDoc,
  serverTimestamp,
  getDocs,
  orderBy,
  Timestamp,
  doc,
  getDoc,
  deleteDoc,
  where,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Image from 'next/image'
import { useAuth } from '../context/AuthContext'
import SelectCustom from '@/components/SelectCustom'
import {
  XMarkIcon,
  ChatBubbleLeftIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

export default function Simulados() {
  // Estados principais e hooks no topo
  const { user } = useAuth()
  // Carregar filtros do usuário ao montar ou quando o usuário mudar
  useEffect(() => {
    if (!user) {
      setFiltrosUsuario([])
      return
    }
    const carregarFiltros = async () => {
      try {
        const snapshot = await getDocs(
          collection(db, 'users', user.uid, 'filtros_simulados'),
        )
        const filtros = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FiltroUsuario[]
        setFiltrosUsuario(filtros)
      } catch (error) {
        console.error('Erro ao carregar filtros do usuário:', error)
        setFiltrosUsuario([])
      }
    }
    carregarFiltros()
  }, [user])
  const [questoes, setQuestoes] = useState<QuestaoComComentarios[]>([])
  const [questoesCarregadas, setQuestoesCarregadas] = useState(false)
  const [respostasReveladas, setRespostasReveladas] = useState<
    Record<string, boolean>
  >({})
  const [comentariosAbertos, setComentariosAbertos] = useState<
    Record<string, boolean>
  >({})
  const [comentariosPorQuestao, setComentariosPorQuestao] = useState<
    Record<string, Comentario[]>
  >({})
  // Filtros personalizados
  interface FiltroUsuario {
    id: string
    banca: string
    concurso: string
    disciplina: string
    status: string
    nome: string
    criadoEm?: Timestamp | null
  }
  const [filtrosUsuario, setFiltrosUsuario] = useState<FiltroUsuario[]>([])
  const [selectedFiltroUsuario, setSelectedFiltroUsuario] = useState<string>('')
  const [modalCriarFiltroAberto, setModalCriarFiltroAberto] = useState(false)
  const [novoFiltro, setNovoFiltro] = useState({
    banca: 'todos',
    concurso: 'todos',
    disciplina: 'todos',
    status: 'todos',
    nome: '',
  })
  const [salvandoFiltro, setSalvandoFiltro] = useState(false)
  // Modal de confirmação de exclusão de filtro
  const [modalConfirmarDeleteFiltro, setModalConfirmarDeleteFiltro] =
    useState(false)
  const [filtroParaDeletar, setFiltroParaDeletar] = useState<string | null>(
    null,
  )
  // Opções de filtros vindas do Firestore
  const [opcoesFiltros, setOpcoesFiltros] = useState({
    bancas: [] as string[],
    concursos: [] as string[],
    disciplinas: [] as string[],
  })
  useEffect(() => {
    async function buscarOpcoesFiltros() {
      try {
        const snapshot = await getDocs(collection(db, 'questoes'))
        const bancas = new Set<string>()
        const concursos = new Set<string>()
        const disciplinas = new Set<string>()
        snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data()
          if (data.banca) bancas.add(data.banca)
          if (data.concurso) concursos.add(data.concurso)
          if (data.disciplina) disciplinas.add(data.disciplina)
        })
        setOpcoesFiltros({
          bancas: Array.from(bancas).sort(),
          concursos: Array.from(concursos).sort(),
          disciplinas: Array.from(disciplinas).sort(),
        })
      } catch (error) {
        console.error('Erro ao buscar opções de filtros:', error)
      }
    }
    buscarOpcoesFiltros()
  }, [])

  // Variável derivada
  const questoesPaginadas = questoes

  // Função para carregar mais questões (paginação)
  const carregarMaisQuestoes = (reset: boolean) => {
    setCarregandoMais(true)
    ;(async () => {
      try {
        const q = collection(db, 'questoes')
        let qQuery = query(q)
        // Adicione filtros conforme necessário
        // ...
        // Exemplo: paginar
        if (!reset && ultimoDoc) {
          qQuery = query(q, startAfter(ultimoDoc))
        }
        const snapshot = await getDocs(qQuery)
        const novasQuestoes = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as QuestaoComComentarios[]
        setQuestoes((prev) =>
          reset ? novasQuestoes : [...prev, ...novasQuestoes],
        )
        setUltimoDoc(snapshot.docs[snapshot.docs.length - 1] || null)
        setTemMais(snapshot.docs.length > 0)
        setQuestoesCarregadas(true)
      } catch (error) {
        console.error('Erro ao carregar questões:', error)
      } finally {
        setCarregandoMais(false)
      }
    })()
  }

  // Função para responder uma questão
  const responder = async (questao: QuestaoComComentarios) => {
    const respostaEscolhida = respostasEscolhidas[questao.id]
    if (!respostaEscolhida) return
    const correto =
      respostaEscolhida.toUpperCase() === questao.resposta.toUpperCase()
    setResultados((prev) => ({
      ...prev,
      [questao.id]: { correto, respostaEscolhida },
    }))
    setRespostasReveladas((prev) => ({ ...prev, [questao.id]: true }))
    // Salvar resposta no Firebase
    if (user) {
      try {
        const respostasRef = collection(
          db,
          'users',
          user.uid,
          'respostas_simulados',
        )
        const q = query(respostasRef, where('questaoId', '==', questao.id))
        const existingResponse = await getDocs(q)
        if (existingResponse.empty) {
          await addDoc(respostasRef, {
            questaoId: questao.id,
            enunciado: questao.enunciado,
            respostaEscolhida,
            respostaCorreta: questao.resposta,
            correto,
            concurso: questao.concurso,
            disciplina: questao.disciplina,
            banca: questao.banca,
            timestamp: serverTimestamp(),
          })
        }
      } catch (error) {
        console.error('Erro ao salvar resposta:', error)
      }
    }
  }

  // Função para riscar/desriscar alternativa
  const toggleAlternativaRiscada = (questaoId: string, letra: string) => {
    setAlternativasRiscadas((prev) => {
      const atuais = prev[questaoId] || []
      if (atuais.includes(letra)) {
        return { ...prev, [questaoId]: atuais.filter((l) => l !== letra) }
      } else {
        return { ...prev, [questaoId]: [...atuais, letra] }
      }
    })
  }

  // Função para formatar data
  const formatDate = (timestamp: Timestamp | null): string => {
    if (!timestamp) return '-'
    return timestamp.toDate().toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Função para selecionar alternativa
  const selecionarAlternativa = (questaoId: string, letra: string) => {
    const atual = respostasEscolhidas[questaoId]
    if (atual?.toUpperCase() === letra.toUpperCase()) {
      setRespostasEscolhidas((prev) => {
        const novo = { ...prev }
        delete novo[questaoId]
        return novo
      })
    } else {
      setRespostasEscolhidas((prev) => ({ ...prev, [questaoId]: letra }))
    }
  }

  // Função para alternar comentários
  const toggleComentarios = async (questaoId: string) => {
    const estaAberto = comentariosAbertos[questaoId]
    setComentariosAbertos((prev) => ({ ...prev, [questaoId]: !estaAberto }))
    if (!estaAberto && !comentariosPorQuestao[questaoId]) {
      await carregarComentarios(questaoId)
    }
  }

  // Função para adicionar comentário
  const handleAdicionarComentario = async (questaoId: string) => {
    const textoComentario = novoComentarioPorQuestao[questaoId]
    if (!textoComentario?.trim() || !user) return
    setEnviandoComentario((prev) => ({ ...prev, [questaoId]: true }))
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      const userData = userDoc.data()
      const userName = userData?.name || user.displayName || 'Usuário'
      const userPhoto = userData?.photo || user.photoURL || ''
      await addDoc(collection(db, 'questoes', questaoId, 'comentarios'), {
        uid: user.uid,
        nome: userName,
        photoUrl: userPhoto,
        texto: textoComentario.trim(),
        createdAt: serverTimestamp(),
      })
      setNovoComentarioPorQuestao((prev) => ({ ...prev, [questaoId]: '' }))
      await carregarComentarios(questaoId)
    } catch (error) {
      console.error('Erro ao criar comentário:', error)
    } finally {
      setEnviandoComentario((prev) => ({ ...prev, [questaoId]: false }))
    }
  }

  // Função para carregar comentários
  const carregarComentarios = async (questaoId: string) => {
    try {
      const q = query(
        collection(db, 'questoes', questaoId, 'comentarios'),
        orderBy('createdAt', 'desc'),
      )
      const snapshot = await getDocs(q)
      const comentariosData = snapshot.docs.map(
        (doc: QueryDocumentSnapshot<DocumentData>) => ({
          id: doc.id,
          ...doc.data(),
        }),
      ) as Comentario[]
      setComentariosPorQuestao((prev) => ({
        ...prev,
        [questaoId]: comentariosData,
      }))
    } catch (error) {
      console.error('Erro ao carregar comentários:', error)
    }
  }

  // Função para deletar comentário
  const handleDeletarComentario = async (
    questaoId: string,
    comentarioId: string,
  ) => {
    try {
      await deleteDoc(
        doc(db, 'questoes', questaoId, 'comentarios', comentarioId),
      )
      await carregarComentarios(questaoId)
    } catch (error) {
      console.error('Erro ao deletar comentário:', error)
    }
  }
  const [novoComentarioPorQuestao, setNovoComentarioPorQuestao] = useState<
    Record<string, string>
  >({})
  const [enviandoComentario, setEnviandoComentario] = useState<
    Record<string, boolean>
  >({})
  const [respostasEscolhidas, setRespostasEscolhidas] = useState<
    Record<string, string>
  >({})
  const [alternativasRiscadas, setAlternativasRiscadas] = useState<
    Record<string, string[]>
  >({})
  const [resultados, setResultados] = useState<
    Record<string, { correto: boolean; respostaEscolhida: string }>
  >({})
  const [selectedBanca, setSelectedBanca] = useState<string>('todos')
  const [selectedConcurso, setSelectedConcurso] = useState<string>('todos')
  const [selectedDisciplina, setSelectedDisciplina] = useState<string>('todos')
  const [selectedStatusResposta, setSelectedStatusResposta] =
    useState<string>('todos')
  const [ultimoDoc, setUltimoDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [temMais, setTemMais] = useState(true)
  const [carregandoMais, setCarregandoMais] = useState(false)
  // Filtros personalizados
  interface FiltroUsuario {
    id: string
    banca: string
    concurso: string
    disciplina: string
    status: string
    nome: string
    criadoEm?: Timestamp | null
  }

  interface Questao {
    id: string
    enunciado: string
    opcoes: {
      a: string
      b: string
      c: string
      d: string
      e?: string
    }
    resposta: string
    explicacao: string
    banca: string
    concurso: string
    disciplina: string
    ano: number
    createdAt: Timestamp | null
    updatedAt: Timestamp | null
  }

  interface Comentario {
    id: string
    uid: string
    nome: string
    photoUrl: string
    texto: string
    createdAt: Timestamp | null
  }

  interface QuestaoComComentarios extends Questao {
    comentarios?: Comentario[]
    totalComentarios?: number
  }

  return (
    <main className="w-full min-h-full flex flex-col pt-4 pb-24 md:pb-4">
      <div className="max-w-6xl w-full mx-auto flex flex-col gap-4 z-40 px-4 ">
        {/* Header */}
        <div className="mb-8 flex justify-end md:hidden">
          <h1 className="text-4xl font-bold text-white">Simulado</h1>
        </div>
        {/* Filtros fixos no topo */}
        <div className="glassmorphism-pill w-full p-4 rounded-3xl flex flex-col md:flex-row gap-3 flex-wrap sticky -mt-8 md:mt-0">
          <div className="w-full md:w-56">
            <SelectCustom
              value={selectedBanca}
              onChange={setSelectedBanca}
              options={[
                { value: 'todos', label: 'Todas as Bancas' },
                ...opcoesFiltros.bancas.map((banca: string) => ({
                  value: banca,
                  label: banca,
                })),
              ]}
            />
          </div>

          <div className="w-full md:w-56">
            <SelectCustom
              value={selectedConcurso}
              onChange={setSelectedConcurso}
              options={[
                { value: 'todos', label: 'Todos os Concursos' },
                ...opcoesFiltros.concursos.map((concurso: string) => ({
                  value: concurso,
                  label: concurso,
                })),
              ]}
            />
          </div>

          <div className="w-full md:w-56">
            <SelectCustom
              value={selectedDisciplina}
              onChange={setSelectedDisciplina}
              options={[
                { value: 'todos', label: 'Todas as Disciplinas' },
                ...opcoesFiltros.disciplinas.map((disciplina: string) => ({
                  value: disciplina,
                  label: disciplina,
                })),
              ]}
            />
          </div>

          <div className="w-full md:w-56">
            <SelectCustom
              value={selectedStatusResposta}
              onChange={setSelectedStatusResposta}
              options={[
                { value: 'todos', label: 'Todos os Status' },
                { value: 'respondida', label: 'Respondida' },
                { value: 'nao-respondida', label: 'Não Respondida' },
              ]}
            />
          </div>

          {/* Linha de botões e Meus Filtros */}
          <div className="w-full flex flex-col md:flex-row gap-2 items-center justify-center">
            <div className="flex justify-center items-center gap-2">
              {user && filtrosUsuario.length > 0 && (
                <div className="max-w-2xs flex items-center gap-2">
                  {selectedFiltroUsuario && (
                    <>
                      <button
                        className="mr-1 p-2 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-white transition"
                        title="Excluir filtro"
                        onClick={() => {
                          setFiltroParaDeletar(selectedFiltroUsuario)
                          setModalConfirmarDeleteFiltro(true)
                        }}
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                      {/* Modal de confirmação para apagar filtro */}
                      {modalConfirmarDeleteFiltro && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
                          <div className="bg-slate-900/90 rounded-3xl p-6 w-full max-w-xs flex flex-col gap-4 relative shadow-2xl border border-slate-700/60 items-center">
                            <h2 className="text-lg font-bold text-red-300 mb-2 text-center">
                              Excluir filtro salvo?
                            </h2>
                            <p className="text-slate-200 text-center text-sm mb-2">
                              Esta ação não pode ser desfeita.
                            </p>
                            <div className="flex gap-2 w-full mt-2">
                              <button
                                className="button-cyan w-full"
                                onClick={() =>
                                  setModalConfirmarDeleteFiltro(false)
                                }
                              >
                                Cancelar
                              </button>
                              <button
                                className="button-cyan w-full bg-red-600 hover:bg-red-700 border-red-400 text-white"
                                onClick={async () => {
                                  if (!filtroParaDeletar) return
                                  try {
                                    await deleteDoc(
                                      doc(
                                        db,
                                        'users',
                                        user.uid,
                                        'filtros_simulados',
                                        filtroParaDeletar,
                                      ),
                                    )
                                    setFiltrosUsuario(
                                      filtrosUsuario.filter(
                                        (f: FiltroUsuario) =>
                                          f.id !== filtroParaDeletar,
                                      ),
                                    )
                                    setSelectedFiltroUsuario('')
                                  } catch {
                                    // Se quiser, pode exibir um toast ou modal de erro aqui
                                  } finally {
                                    setModalConfirmarDeleteFiltro(false)
                                    setFiltroParaDeletar(null)
                                  }
                                }}
                              >
                                Excluir
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <SelectCustom
                    value={selectedFiltroUsuario}
                    onChange={(filtroId: string) => {
                      setSelectedFiltroUsuario(filtroId)
                      const filtro = filtrosUsuario.find(
                        (f: FiltroUsuario) => f.id === filtroId,
                      )
                      if (filtro) {
                        setSelectedBanca(filtro.banca || 'todos')
                        setSelectedConcurso(filtro.concurso || 'todos')
                        setSelectedDisciplina(filtro.disciplina || 'todos')
                        setSelectedStatusResposta(filtro.status || 'todos')
                      }
                    }}
                    options={[
                      { value: '', label: 'Meus Filtros Salvos' },
                      ...filtrosUsuario.map((f: FiltroUsuario) => ({
                        value: f.id,
                        label: f.nome,
                      })),
                    ]}
                  />
                </div>
              )}
            </div>

            <button
              className="button-cyan max-w-2xs"
              onClick={() => {
                setQuestoes([])
                setUltimoDoc(null)
                setTemMais(true)
                setQuestoesCarregadas(false)
                carregarMaisQuestoes(true)
              }}
            >
              Buscar
            </button>
            <button
              className="button-cyan max-w-2xs"
              onClick={() => setModalCriarFiltroAberto(true)}
            >
              Criar Filtro
            </button>
          </div>

          {/* Modal Criar Filtro */}
        </div>
        {modalCriarFiltroAberto && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/10 backdrop-blur-xs p-4 h-full z-200"
            style={{ backdropFilter: 'blur(8px)' }}
          >
            <div
              className="bg-slate-900/90 rounded-3xl p-6 md:p-8 w-full max-w-md flex flex-col gap-4 relative shadow-2xl border border-slate-700/60"
              style={{ marginTop: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setModalCriarFiltroAberto(false)}
                className="close-button"
                aria-label="Fechar"
                title="Fechar"
              >
                <XMarkIcon className="h-4 w-4 text-white" />
              </button>
              <h2 className="text-xl font-bold text-cyan-300 mb-2 text-center">
                Criar Filtro Personalizado
              </h2>
              <SelectCustom
                value={novoFiltro.banca}
                onChange={(v: string) =>
                  setNovoFiltro((f) => ({ ...f, banca: v }))
                }
                options={[
                  { value: 'todos', label: 'Todas as Bancas' },
                  ...opcoesFiltros.bancas.map((banca: string) => ({
                    value: banca,
                    label: banca,
                  })),
                ]}
              />
              <SelectCustom
                value={novoFiltro.concurso}
                onChange={(v: string) =>
                  setNovoFiltro((f) => ({ ...f, concurso: v }))
                }
                options={[
                  { value: 'todos', label: 'Todos os Concursos' },
                  ...opcoesFiltros.concursos.map((concurso: string) => ({
                    value: concurso,
                    label: concurso,
                  })),
                ]}
              />
              <SelectCustom
                value={novoFiltro.disciplina}
                onChange={(v: string) =>
                  setNovoFiltro((f) => ({ ...f, disciplina: v }))
                }
                options={[
                  { value: 'todos', label: 'Todas as Disciplinas' },
                  ...opcoesFiltros.disciplinas.map((disciplina: string) => ({
                    value: disciplina,
                    label: disciplina,
                  })),
                ]}
              />
              <SelectCustom
                value={novoFiltro.status}
                onChange={(v: string) =>
                  setNovoFiltro((f) => ({ ...f, status: v }))
                }
                options={[
                  { value: 'todos', label: 'Todos os Status' },
                  { value: 'respondida', label: 'Respondida' },
                  { value: 'nao-respondida', label: 'Não Respondida' },
                ]}
              />
              <input
                type="text"
                className="input-style-1 w-full mt-2"
                placeholder="Nome do filtro"
                value={novoFiltro.nome}
                onChange={(e) =>
                  setNovoFiltro((f) => ({ ...f, nome: e.target.value }))
                }
                maxLength={40}
              />
              <button
                className="button-cyan w-full mt-2"
                disabled={salvandoFiltro || !novoFiltro.nome.trim()}
                onClick={async () => {
                  if (!user) return
                  setSalvandoFiltro(true)
                  try {
                    // Salvar filtro no Firestore (coleção: users/{uid}/filtros_simulados)
                    await addDoc(
                      collection(db, 'users', user.uid, 'filtros_simulados'),
                      {
                        nome: novoFiltro.nome.trim(),
                        banca: novoFiltro.banca,
                        concurso: novoFiltro.concurso,
                        disciplina: novoFiltro.disciplina,
                        status: novoFiltro.status,
                        criadoEm: serverTimestamp(),
                      },
                    )
                    setModalCriarFiltroAberto(false)
                    setNovoFiltro({
                      banca: 'todos',
                      concurso: 'todos',
                      disciplina: 'todos',
                      status: 'todos',
                      nome: '',
                    })
                  } catch (err) {
                    console.error('Erro ao salvar filtro:', err)
                    alert(
                      'Erro ao salvar filtro! ' +
                        (err &&
                        typeof err === 'object' &&
                        err !== null &&
                        'message' in err &&
                        typeof (err as { message?: string }).message ===
                          'string'
                          ? (err as { message: string }).message
                          : ''),
                    )
                  } finally {
                    setSalvandoFiltro(false)
                  }
                }}
              >
                {salvandoFiltro ? 'Salvando...' : 'Confirmar Filtro'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de questões */}
      {!questoesCarregadas ? (
        <div className="text-center py-8 z-50 mt-20">
          <p className="text-slate-400">
            Selecione os filtros desejados e clique em buscar
            <br />
            ou crie seu filtro personalizado e clique em buscar
          </p>
        </div>
      ) : questoesPaginadas.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400">
            Nenhuma questão encontrada com os filtros selecionados
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {questoesPaginadas.map((questao, index) => (
            <React.Fragment key={questao.id}>
              <div
                key={questao.id}
                className="glassmorphism-pill ring-0 md:ring-2 flex flex-col gap-4 mt-16 md:mt-8 py-4 p-0 md:p-4 rounded-3xl transition-all shadow-lg shadow-black/30 md:max-w-6xl mx-auto px-4"
              >
                {/* Cabeçalho da questão */}
                <div className="flex items-start w-full gap-3 pb-3 border-b border-slate-600/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-bold text-cyan-300">
                        Questão {index + 1}
                      </span>
                      {resultados[questao.id] && (
                        <span className="px-2 py-1 rounded-full bg-green-500/20 border border-green-400/30 text-xs font-semibold text-green-200 flex items-center gap-1">
                          ✓ Respondida
                        </span>
                      )}
                      {/* Dificuldade da questão removida */}
                    </div>
                    <p className="text-sm text-slate-300 mt-1">
                      {questao.banca} • {questao.concurso} • {questao.ano} •{' '}
                      {questao.disciplina}
                    </p>
                  </div>
                </div>

                {/* Enunciado */}
                <div className="space-y-4">
                  <p className="text-base text-white leading-relaxed">
                    {questao.enunciado}
                  </p>

                  {/* Opções */}
                  <div className="space-y-3">
                    {Object.entries(questao.opcoes)
                      .sort(([letraA], [letraB]) =>
                        letraA.localeCompare(letraB),
                      )
                      .map(([letra, texto]) => {
                        const isCorreta =
                          letra.toUpperCase() === questao.resposta.toUpperCase()
                        const estaEscolhida =
                          respostasEscolhidas[questao.id]?.toUpperCase() ===
                          letra.toUpperCase()
                        const estaRiscada = (
                          alternativasRiscadas[questao.id] || []
                        ).some((l) => l.toUpperCase() === letra.toUpperCase())
                        const temResultado = resultados[questao.id]

                        return (
                          <div
                            key={letra}
                            className={`w-full p-4 rounded-2xl border transition-all flex items-start gap-3 ${
                              temResultado
                                ? isCorreta
                                  ? 'bg-green-500/20 border-green-400/50'
                                  : estaEscolhida
                                    ? 'bg-red-500/20 border-red-400/50'
                                    : 'bg-slate-700/30 border-slate-600/30'
                                : estaEscolhida
                                  ? 'bg-cyan-500/20 border-cyan-400/50'
                                  : estaRiscada
                                    ? 'bg-yellow-500/10 border-yellow-600/30'
                                    : 'bg-slate-700/30 border-slate-600/30'
                            } ${estaRiscada ? 'opacity-60' : ''}`}
                          >
                            {/* Radio Button */}
                            <button
                              onClick={() =>
                                selecionarAlternativa(questao.id, letra)
                              }
                              className={`mt-1 shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                estaEscolhida
                                  ? 'bg-cyan-400 border-cyan-300'
                                  : 'border-slate-400 hover:border-cyan-400'
                              }`}
                              disabled={estaRiscada}
                            >
                              {estaEscolhida && (
                                <div className="w-2 h-2 bg-slate-900 rounded-full" />
                              )}
                            </button>

                            {/* Texto da Alternativa */}
                            <button
                              onClick={() =>
                                selecionarAlternativa(questao.id, letra)
                              }
                              disabled={estaRiscada}
                              className="flex-1 text-left"
                            >
                              <span
                                className={`font-bold text-cyan-300 ${
                                  estaRiscada ? 'line-through opacity-50' : ''
                                }`}
                              >
                                {letra.toUpperCase()})
                              </span>
                              <span
                                className={`text-slate-100 ml-2 ${
                                  estaRiscada ? 'line-through opacity-50' : ''
                                }`}
                              >
                                {texto}
                              </span>
                            </button>

                            {/* Botão de Riscar */}
                            <button
                              onClick={() =>
                                toggleAlternativaRiscada(questao.id, letra)
                              }
                              className={`shrink-0 p-2 rounded-lg transition-all ${
                                estaRiscada
                                  ? 'bg-yellow-500/30 text-yellow-300 hover:bg-yellow-500/40'
                                  : 'text-slate-400 hover:bg-slate-700/30 hover:text-yellow-400'
                              }`}
                              title={
                                estaRiscada
                                  ? 'Desriscar alternativa'
                                  : 'Riscar alternativa'
                              }
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </div>
                        )
                      })}
                  </div>

                  {/* Resultado */}
                  {resultados[questao.id] && (
                    <div
                      className={`p-4 rounded-2xl border ${
                        resultados[questao.id].correto
                          ? 'bg-green-500/20 border-green-400/30'
                          : 'bg-red-500/20 border-red-400/30'
                      }`}
                    >
                      <p
                        className={`font-semibold text-sm ${
                          resultados[questao.id].correto
                            ? 'text-green-300'
                            : 'text-red-300'
                        }`}
                      >
                        {resultados[questao.id].correto
                          ? '✅ Resposta Correta!'
                          : `❌ Resposta Incorreta! A resposta correta é ${questao.resposta.toUpperCase()}`}
                      </p>
                    </div>
                  )}

                  {/* Botões de Ação */}
                  <button
                    onClick={() => responder(questao)}
                    className="button-cyan w-full"
                    disabled={!respostasEscolhidas[questao.id]}
                  >
                    Responder
                  </button>

                  {/* Explicação */}
                  {respostasReveladas[questao.id] && (
                    <div className="bg-cyan-500/10 border border-cyan-400/30 rounded-2xl p-4">
                      <p className="text-sm font-semibold text-cyan-300 mb-2">
                        ✅ Resposta Correta: {questao.resposta.toUpperCase()}
                      </p>
                      <p className="text-sm text-slate-200 leading-relaxed">
                        {questao.explicacao}
                      </p>
                    </div>
                  )}
                </div>

                {/* Seção de Comentários */}
                <div className="border-t border-slate-600/30 pt-4 w-full">
                  <button
                    onClick={() => toggleComentarios(questao.id)}
                    className="flex items-center gap-2 text-cyan-300 hover:text-cyan-200 transition-colors"
                  >
                    <ChatBubbleLeftIcon className="h-5 w-5" />
                    <span className="text-sm font-semibold">
                      {comentariosAbertos[questao.id]
                        ? 'Ocultar Comentários'
                        : `Ver Comentários (${questao.totalComentarios || 0})`}
                    </span>
                  </button>

                  {comentariosAbertos[questao.id] && (
                    <div className="mt-4 space-y-4">
                      {/* Formulário de novo comentário */}
                      {user && (
                        <div className="flex gap-2 items-center">
                          <textarea
                            value={novoComentarioPorQuestao[questao.id] || ''}
                            onChange={(e) =>
                              setNovoComentarioPorQuestao((prev) => ({
                                ...prev,
                                [questao.id]: e.target.value,
                              }))
                            }
                            placeholder="Adicione um comentário..."
                            className="input-style-1 flex-1 min-h-20 rounded-3xl"
                            disabled={enviandoComentario[questao.id]}
                          />
                          <button
                            onClick={() =>
                              handleAdicionarComentario(questao.id)
                            }
                            disabled={
                              !novoComentarioPorQuestao[questao.id]?.trim() ||
                              enviandoComentario[questao.id]
                            }
                            className="button-cyan w-fit shrink-0 h-max"
                          >
                            {enviandoComentario[questao.id] ? '...' : 'Enviar'}
                          </button>
                        </div>
                      )}

                      {/* Lista de comentários */}
                      <div className="space-y-3">
                        {!comentariosPorQuestao[questao.id] ? (
                          <p className="text-sm text-slate-400 text-center py-4">
                            Carregando comentários...
                          </p>
                        ) : comentariosPorQuestao[questao.id].length === 0 ? (
                          <p className="text-sm text-slate-400 text-center py-4">
                            Nenhum comentário ainda. Seja o primeiro!
                          </p>
                        ) : (
                          comentariosPorQuestao[questao.id].map((coment) => (
                            <div
                              key={coment.id}
                              className="bg-slate-700/30 rounded-2xl p-4 space-y-2"
                            >
                              <div className="flex items-start gap-3">
                                {coment.photoUrl && (
                                  <div className="relative h-8 w-8 shrink-0">
                                    <Image
                                      src={coment.photoUrl}
                                      alt={coment.nome}
                                      fill
                                      className="rounded-full object-cover"
                                      unoptimized
                                    />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-cyan-300">
                                    {coment.nome}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {formatDate(coment.createdAt)}
                                  </p>
                                </div>
                                {user?.uid === coment.uid && (
                                  <button
                                    onClick={() =>
                                      handleDeletarComentario(
                                        questao.id,
                                        coment.id,
                                      )
                                    }
                                    className="p-1.5 text-red-400 hover:text-red-300 transition-colors"
                                    title="Deletar comentário"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                              <p className="text-sm text-slate-100">
                                {coment.texto}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Linha separadora para mobile */}
              <div className="block md:hidden w-full h-2 bg-linear-to-r from-cyan-900/10 to-transparent my-2" />
            </React.Fragment>
          ))}
          {/* Botão Carregar mais */}
          <div className="flex justify-center z-150">
            <button
              className={`button-cyan w-fit m-6 transition-all ${
                carregandoMais ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              onClick={() => carregarMaisQuestoes(false)}
              disabled={!temMais || carregandoMais}
            >
              {carregandoMais
                ? 'Carregando...'
                : temMais
                  ? 'Carregar mais'
                  : 'Sem mais questões'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
