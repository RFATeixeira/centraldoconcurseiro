'use client'

import { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  serverTimestamp,
  query,
  where,
  arrayUnion,
  addDoc,
  deleteDoc,
  arrayRemove,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../context/AuthContext'
import Link from 'next/link'
import ModalAdicionarConcurso from '../../components/ModalAdicionarConcurso'

interface Concurso {
  id: string
  nome: string
  ano: number
  totalCandidatos: number
}

interface Classificacao {
  cpf?: string
  posicao?: number
  score?: number
  nome?: string
  inscricao?: string
  regiao?: string
  resultado_taf?: string
}

export default function ConcursosDisponiveis() {
  const { user } = useAuth()
  const [concursos, setConcursos] = useState<Concurso[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedConcurso, setSelectedConcurso] = useState<Concurso | null>(
    null,
  )
  const [userConcursos, setUserConcursos] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadConcursos = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'concursos'))
        const concursosList = snapshot.docs.map((doc) => ({
          id: doc.id,
          nome: doc.data().nome,
          ano: doc.data().ano,
          totalCandidatos: doc.data().totalCandidatos,
        }))
        setConcursos(concursosList)
      } catch (error) {
        console.error('Erro ao carregar concursos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadConcursos()
  }, [])

  // Carrega concursos do usuário
  useEffect(() => {
    if (!user) return

    const loadUserConcursos = async () => {
      try {
        const userConcursosRef = collection(db, 'users', user.uid, 'concursos')
        const snapshot = await getDocs(userConcursosRef)
        const ids = new Set(snapshot.docs.map((doc) => doc.id))
        setUserConcursos(ids)
      } catch (error) {
        console.error('Erro ao carregar concursos do usuário:', error)
      }
    }

    loadUserConcursos()
  }, [user])

  const handleAdicionarConcurso = async (numeroInscricao: string) => {
    if (!user || !selectedConcurso) return

    try {
      // Busca os dados do concurso para obter as classificações
      const concursoDoc = await getDoc(
        doc(db, 'concursos', selectedConcurso.id),
      )
      const concursoData = concursoDoc.data()
      const classificacoes: Classificacao[] = concursoData?.classificacoes || []

      // Log para debug
      console.log('Classificações disponíveis:', classificacoes.length)
      console.log('Procurando por:', numeroInscricao)
      console.log('Primeiras 3 classificações:', classificacoes.slice(0, 3))

      // Busca a classificação do usuário na planilha
      // Procura por número de inscrição (exato ou parcial)
      let userClassificacao = classificacoes.find((c: Classificacao) => {
        const inscricao = String(c.inscricao || '')
        return (
          inscricao === numeroInscricao || inscricao.includes(numeroInscricao)
        )
      })

      // Se não encontrou por inscrição, tenta por nome
      if (!userClassificacao) {
        console.log('Inscrição não encontrada, tentando por nome...')
        userClassificacao = classificacoes.find((c: Classificacao) =>
          c.nome?.toLowerCase().includes(numeroInscricao.toLowerCase().trim()),
        )
      }

      if (!userClassificacao) {
        alert(
          'Classificação não encontrada. Verifique o número de inscrição informado.',
        )
        return
      }

      // Salva o concurso para o usuário
      await setDoc(
        doc(db, 'users', user.uid, 'concursos', selectedConcurso.id),
        {
          concursoId: selectedConcurso.id,
          concursoNome: selectedConcurso.nome,
          concursoAno: selectedConcurso.ano,
          numeroInscricao,
          regiao: userClassificacao?.regiao || null,
          resultado_taf: userClassificacao?.resultado_taf || null,
          posicao: userClassificacao?.posicao || null,
          score: userClassificacao?.score || null,
          totalCandidatos: selectedConcurso.totalCandidatos,
          addedAt: serverTimestamp(),
        },
      )

      // Criar ou atualizar grupo do concurso e adicionar usuário
      try {
        console.log(
          'Criando/atualizando grupo para concurso:',
          selectedConcurso.id,
          selectedConcurso.nome,
        )

        // Procura grupo existente do concurso
        const q = query(
          collection(db, 'chats'),
          where('concursoId', '==', selectedConcurso.id),
        )
        const snapshot = await getDocs(q)

        if (snapshot.empty) {
          // Criar novo grupo para o concurso
          console.log('Criando novo grupo do concurso')
          const newChatRef = await addDoc(collection(db, 'chats'), {
            tipo: 'group',
            nome: selectedConcurso.nome,
            concursoId: selectedConcurso.id,
            photoUrl: '',
            descricao: `Grupo para o concurso ${selectedConcurso.nome}`,
            members: [user.uid],
            admin: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
          console.log('Grupo criado com ID:', newChatRef.id)
        } else {
          // Adicionar usuário ao grupo existente
          const groupId = snapshot.docs[0].id
          console.log('Adicionando usuário ao grupo existente:', groupId)
          await setDoc(
            doc(db, 'chats', groupId),
            {
              members: arrayUnion(user.uid),
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          )
          console.log('Usuário adicionado ao grupo')
        }
      } catch (error) {
        console.error('Erro ao criar/atualizar grupo do concurso:', error)
      }

      // Adiciona à lista local
      setUserConcursos((prev) => new Set([...prev, selectedConcurso.id]))
      setSelectedConcurso(null)
    } catch (error) {
      console.error('Erro ao adicionar concurso:', error)
      alert('Erro ao adicionar concurso')
    }
  }

  const handleRemoverConcurso = async (concurso: Concurso) => {
    if (!user) return

    const confirmar = confirm(
      `Tem certeza que deseja remover o concurso "${concurso.nome}"?`,
    )
    if (!confirmar) return

    try {
      // Remove o concurso da subcoleção do usuário
      await deleteDoc(doc(db, 'users', user.uid, 'concursos', concurso.id))

      // Remove usuário do grupo do chat
      try {
        const q = query(
          collection(db, 'chats'),
          where('concursoId', '==', concurso.id),
        )
        const snapshot = await getDocs(q)

        if (!snapshot.empty) {
          const groupId = snapshot.docs[0].id
          await setDoc(
            doc(db, 'chats', groupId),
            {
              members: arrayRemove(user.uid),
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          )
        }
      } catch (error) {
        console.error('Erro ao remover usuário do grupo:', error)
      }

      // Remove da lista local
      setUserConcursos((prev) => {
        const newSet = new Set(prev)
        newSet.delete(concurso.id)
        return newSet
      })
    } catch (error) {
      console.error('Erro ao remover concurso:', error)
      alert('Erro ao remover concurso')
    }
  }

  if (loading) {
    return (
      <main className="w-full min-h-full flex items-center justify-center p-4">
        <p className="text-gray-400">Carregando concursos...</p>
      </main>
    )
  }

  return (
    <main className="w-full min-h-full flex flex-col p-4 pb-24 md:pb-4 ">
      <div className="max-w-6xl w-full mx-auto z-150">
        {/* Header */}
        <div className="mb-8 text-right md:text-left">
          <h1 className="text-4xl font-bold text-white mb-2">
            Concursos Disponíveis
          </h1>
          <p className="text-gray-400">
            {concursos.length} concurso{concursos.length !== 1 ? 's' : ''}{' '}
            disponível{concursos.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Grid de Concursos */}
        {concursos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-4">Nenhum concurso disponível</p>
            <Link
              href="/admin"
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Adicionar concurso →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {concursos.map((concurso) => {
              const isAdded = userConcursos.has(concurso.id)

              return (
                <div
                  key={concurso.id}
                  className="glassmorphism-pill rounded-2xl p-6 flex flex-col gap-4"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {concurso.nome}
                    </h3>
                    <p className="text-sm text-gray-400">Ano: {concurso.ano}</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">
                      Total de Candidatos
                    </p>
                    <p className="text-xl font-bold text-cyan-300 mt-1">
                      {concurso.totalCandidatos.toLocaleString('pt-BR')}
                    </p>
                  </div>

                  {isAdded ? (
                    <div className="flex gap-2">
                      <button disabled className="button-cyan w-fit">
                        ✓ Adicionado
                      </button>
                      <button
                        onClick={() => handleRemoverConcurso(concurso)}
                        className="button-red w-fit"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedConcurso(concurso)}
                      className="button-green"
                    >
                      Adicionar ao Perfil
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedConcurso && (
        <ModalAdicionarConcurso
          concurso={selectedConcurso}
          onConfirm={handleAdicionarConcurso}
          onClose={() => setSelectedConcurso(null)}
        />
      )}
    </main>
  )
}
