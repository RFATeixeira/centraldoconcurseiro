'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  orderBy,
  Timestamp,
  doc,
  getDoc,
  deleteDoc,
  where,
} from 'firebase/firestore'
import Image from 'next/image'
import { db } from '../../lib/firebase'
import { useAuth } from '../context/AuthContext'
import {
  TrashIcon,
  ChatBubbleLeftIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

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
  // dificuldade removida
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

export default function Simulados() {
  const { user } = useAuth()
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

  // Filtros
  const [selectedBanca, setSelectedBanca] = useState<string>('todos')
  const [selectedConcurso, setSelectedConcurso] = useState<string>('todos')
  const [selectedDisciplina, setSelectedDisciplina] = useState<string>('todos')
  // const [selectedDificuldade, setSelectedDificuldade] =
  //   useState<string>('todos')
  const [selectedStatusResposta, setSelectedStatusResposta] =
    useState<string>('todos')

  // Carregar todas as questões
  useEffect(() => {
    const q = query(collection(db, 'questoes'), orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const questoesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as QuestaoComComentarios[]

        // Carregar contagem de comentários para cada questão
        for (const questao of questoesData) {
          try {
            const comentariosRef = collection(
              db,
              'questoes',
              questao.id,
              'comentarios',
            )
            const comentariosSnap = await getDocs(comentariosRef)
            questao.totalComentarios = comentariosSnap.size
          } catch (error) {
            console.error(
              `Erro ao carregar comentários da questão ${questao.id}:`,
              error,
            )
            questao.totalComentarios = 0
          }
        }

        setQuestoes(questoesData)
        setQuestoesCarregadas(true)

        // Carregar respostas do usuário
        if (user) {
          try {
            const respostasRef = collection(
              db,
              'users',
              user.uid,
              'respostas_simulados',
            )
            const respostasSnap = await getDocs(respostasRef)

            const respostasMap: Record<string, string> = {}
            const resultadosMap: Record<
              string,
              { correto: boolean; respostaEscolhida: string }
            > = {}

            respostasSnap.forEach((doc) => {
              const dados = doc.data()
              respostasMap[dados.questaoId] = dados.respostaEscolhida
              resultadosMap[dados.questaoId] = {
                correto: dados.correto,
                respostaEscolhida: dados.respostaEscolhida,
              }
            })

            setRespostasEscolhidas(respostasMap)
            setResultados(resultadosMap)
            console.log('✅ Respostas carregadas do Firestore')
          } catch (error) {
            console.error('Erro ao carregar respostas do usuário:', error)
          }
        }
      },
      (error) => {
        console.error('❌ ERRO ao carregar questões:', error)
        setQuestoesCarregadas(true)
      },
    )

    return () => unsubscribe()
  }, [user])

  // Obter opções únicas de filtros
  const opcoesFiltros = useMemo(() => {
    const bancas = new Set<string>()
    const concursos = new Set<string>()
    const disciplinas = new Set<string>()

    questoes.forEach((q) => {
      bancas.add(q.banca)
      concursos.add(q.concurso)
      disciplinas.add(q.disciplina)
    })

    return {
      bancas: Array.from(bancas).sort(),
      concursos: Array.from(concursos).sort(),
      disciplinas: Array.from(disciplinas).sort(),
    }
  }, [questoes])

  // Questões filtradas
  const questoesFiltradas = useMemo(() => {
    return questoes.filter((q) => {
      const passaBanca = selectedBanca === 'todos' || q.banca === selectedBanca
      const passaConcurso =
        selectedConcurso === 'todos' || q.concurso === selectedConcurso
      const passaDisciplina =
        selectedDisciplina === 'todos' || q.disciplina === selectedDisciplina
      // const passaDificuldade =
      //   selectedDificuldade === 'todos' || q.dificuldade === selectedDificuldade

      // Filtro de status de resposta
      let passaStatusResposta = true
      if (selectedStatusResposta === 'respondidas') {
        passaStatusResposta = !!resultados[q.id]
      } else if (selectedStatusResposta === 'nao-respondidas') {
        passaStatusResposta = !resultados[q.id]
      }

      return (
        passaBanca &&
        passaConcurso &&
        passaDisciplina &&
        /* passaDificuldade && */
        passaStatusResposta
      )
    })
  }, [
    questoes,
    selectedBanca,
    selectedConcurso,
    selectedDisciplina,
    // selectedDificuldade,
    selectedStatusResposta,
    resultados,
  ])

  const handleAdicionarComentario = async (questaoId: string) => {
    const textoComentario = novoComentarioPorQuestao[questaoId]
    if (!textoComentario?.trim() || !user) {
      return
    }

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

      // Limpar campo de comentário
      setNovoComentarioPorQuestao((prev) => ({ ...prev, [questaoId]: '' }))

      // Recarregar comentários
      carregarComentarios(questaoId)
    } catch (error) {
      console.error('Erro ao criar comentário:', error)
    } finally {
      setEnviandoComentario((prev) => ({ ...prev, [questaoId]: false }))
    }
  }

  const carregarComentarios = async (questaoId: string) => {
    try {
      const q = query(
        collection(db, 'questoes', questaoId, 'comentarios'),
        orderBy('createdAt', 'desc'),
      )
      const snapshot = await getDocs(q)
      const comentariosData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Comentario[]

      setComentariosPorQuestao((prev) => ({
        ...prev,
        [questaoId]: comentariosData,
      }))
    } catch (error) {
      console.error('Erro ao carregar comentários:', error)
    }
  }

  const handleDeletarComentario = async (
    questaoId: string,
    comentarioId: string,
  ) => {
    try {
      await deleteDoc(
        doc(db, 'questoes', questaoId, 'comentarios', comentarioId),
      )
      // Recarregar comentários
      carregarComentarios(questaoId)
    } catch (error) {
      console.error('Erro ao deletar comentário:', error)
    }
  }

  const toggleComentarios = async (questaoId: string) => {
    const estaAberto = comentariosAbertos[questaoId]
    setComentariosAbertos((prev) => ({ ...prev, [questaoId]: !estaAberto }))

    // Se está abrindo e não tem comentários carregados ainda, carregar
    if (!estaAberto && !comentariosPorQuestao[questaoId]) {
      await carregarComentarios(questaoId)
    }
  }

  const selecionarAlternativa = (questaoId: string, letra: string) => {
    // Toggle: se já está selecionada, desseleciona; caso contrário, seleciona
    const atual = respostasEscolhidas[questaoId]
    if (atual?.toUpperCase() === letra.toUpperCase()) {
      // Remover seleção
      setRespostasEscolhidas((prev) => {
        const novo = { ...prev }
        delete novo[questaoId]
        return novo
      })
    } else {
      // Selecionar nova
      setRespostasEscolhidas((prev) => ({ ...prev, [questaoId]: letra }))
    }
  }

  const toggleAlternativaRiscada = (questaoId: string, letra: string) => {
    setAlternativasRiscadas((prev) => {
      const riscadas = prev[questaoId] || []
      const index = riscadas.findIndex(
        (l) => l.toUpperCase() === letra.toUpperCase(),
      )

      if (index > -1) {
        // Remover do risco
        const novaLista = riscadas.filter((_, i) => i !== index)
        return { ...prev, [questaoId]: novaLista }
      } else {
        // Adicionar ao risco
        return {
          ...prev,
          [questaoId]: [...(riscadas || []), letra],
        }
      }
    })
  }

  const responder = async (questao: QuestaoComComentarios) => {
    const respostaEscolhida = respostasEscolhidas[questao.id]

    if (!respostaEscolhida) {
      alert('Selecione uma alternativa antes de responder!')
      return
    }

    const correto =
      respostaEscolhida.toUpperCase() === questao.resposta.toUpperCase()

    setResultados((prev) => ({
      ...prev,
      [questao.id]: { correto, respostaEscolhida },
    }))

    // Revelar automaticamente a resposta
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

        // Verificar se já existe uma resposta para esta questão
        const q = query(respostasRef, where('questaoId', '==', questao.id))
        const existingResponse = await getDocs(q)

        if (existingResponse.empty) {
          // Salvar nova resposta
          const docRef = await addDoc(respostasRef, {
            questaoId: questao.id,
            enunciado: questao.enunciado,
            respostaEscolhida,
            respostaCorreta: questao.resposta,
            correto,
            concurso: questao.concurso,
            disciplina: questao.disciplina,
            banca: questao.banca,
            // dificuldade: questao.dificuldade,
            timestamp: serverTimestamp(),
          })
          console.log('✅ Resposta salva com sucesso:', docRef.id)
        } else {
          console.log('ℹ️ Resposta já existe para esta questão')
        }
      } catch (error) {
        console.error('❌ Erro ao salvar resposta:', error)
      }
    }
  }

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

  // const getDificuldadeColor = (dificuldade: string): string => {
  //   switch (dificuldade) {
  //     case 'facil':
  //       return 'bg-green-500/20 text-green-200 border-green-400/30'
  //     case 'media':
  //       return 'bg-yellow-500/20 text-yellow-200 border-yellow-400/30'
  //     case 'dificil':
  //       return 'bg-red-500/20 text-red-200 border-red-400/30'
  //     default:
  //       return 'bg-slate-500/20 text-slate-200 border-slate-400/30'
  //   }
  // }

  return (
    <main className="w-full min-h-full flex flex-col pt-4 pb-24 md:pb-4">
      <div className="max-w-6xl w-full mx-auto flex flex-col gap-4 px-4">
        {/* Filtros fixos no topo */}
        <div className="glassmorphism-pill w-full p-4 rounded-3xl flex flex-col md:flex-row gap-3 flex-wrap sticky top-20 md:top-24 z-40">
          <select
            value={selectedBanca}
            onChange={(e) => setSelectedBanca(e.target.value)}
            className="glassmorphism-pill ring-2 ring-cyan-400/30 focus:ring-cyan-400/50"
          >
            <option value="todos">Todas as Bancas</option>
            {opcoesFiltros.bancas.map((banca) => (
              <option key={banca} value={banca}>
                {banca}
              </option>
            ))}
          </select>

          <select
            value={selectedConcurso}
            onChange={(e) => setSelectedConcurso(e.target.value)}
            className="glassmorphism-pill ring-2 ring-cyan-400/30 focus:ring-cyan-400/50"
          >
            <option value="todos">Todos os Concursos</option>
            {opcoesFiltros.concursos.map((concurso) => (
              <option key={concurso} value={concurso}>
                {concurso}
              </option>
            ))}
          </select>

          <select
            value={selectedDisciplina}
            onChange={(e) => setSelectedDisciplina(e.target.value)}
            className="glassmorphism-pill ring-2 ring-cyan-400/30 focus:ring-cyan-400/50 "
          >
            <option value="todos">Todas as Disciplinas</option>
            {opcoesFiltros.disciplinas.map((disciplina) => (
              <option key={disciplina} value={disciplina}>
                {disciplina}
              </option>
            ))}
          </select>

          {/* Filtro de dificuldade removido */}

          <select
            value={selectedStatusResposta}
            onChange={(e) => setSelectedStatusResposta(e.target.value)}
            className="glassmorphism-pill ring-2 ring-cyan-400/30 focus:ring-cyan-400/50"
          >
            <option value="todos">Todas as Questões</option>
            <option value="respondidas">✓ Respondidas</option>
            <option value="nao-respondidas">○ Não Respondidas</option>
          </select>
        </div>

        {/* Lista de questões */}
        {!questoesCarregadas ? (
          <div className="text-center py-8">
            <p className="text-slate-400">Carregando questões...</p>
          </div>
        ) : questoesFiltradas.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400">
              Nenhuma questão encontrada com os filtros selecionados
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {questoesFiltradas.map((questao, index) => (
              <div
                key={questao.id}
                className="glassmorphism-pill p-6 rounded-3xl flex flex-col gap-4 mt-16 md:mt-0"
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
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
