'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './context/AuthContext'
import UserConcursoCard from '../components/UserConcursoCard'
import TopRankingsCard from '../components/TopRankingsCard'
import ProgressoEstudosCard from '../components/ProgressoEstudosCard'
import CardCalendario from '../components/CardCalendario'

interface Ranking {
  concurso: string
  ano: string
  posicao: number
  totalCandidatos: number
  pontos: number
}

interface ConcursoUsuario {
  concursoNome: string
  concursoAno?: string | number
  posicao?: number
  score?: number
  totalCandidatos: number
}

export default function Home() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    emAndamento: 0,
    inscritos: 0,
    finalizados: 0,
  })
  const [rankings, setRankings] = useState<Ranking[]>([])

  useEffect(() => {
    if (!user) return

    const loadUserData = async () => {
      try {
        // Carrega os concursos do usuário
        const userConcursosResponse = await getDocs(
          collection(db, 'users', user.uid, 'concursos'),
        )

        const concursos = userConcursosResponse.docs.map((doc) => ({
          ...doc.data(),
        })) as ConcursoUsuario[]

        // Calcula estatísticas
        const filteredRankings = concursos
          .filter((c) => c.posicao && c.totalCandidatos)
          .map((c) => ({
            concurso: c.concursoNome,
            ano: String(c.concursoAno),
            posicao: c.posicao!,
            totalCandidatos: c.totalCandidatos,
            pontos: c.score || 0,
          }))
          .sort((a, b) => a.posicao - b.posicao)

        setRankings(filteredRankings)
        setStats({
          emAndamento: concursos.length,
          inscritos: concursos.length,
          finalizados: 0,
        })
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      }
    }

    loadUserData()
  }, [user])

  return (
    <main className="w-full min-h-full flex flex-col p-4 gap-6 pb-24 md:pb-4 overflow-x-hidden">
      {/* Cards superiores - Alinhados à esquerda */}
      <div className="flex flex-wrap gap-4 min-w-0">
        <UserConcursoCard stats={stats} />
        <TopRankingsCard rankings={rankings} />
        <ProgressoEstudosCard />
        {/* Calendário de Concursos */}
        <CardCalendario />
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 min-w-0">{/* Adicione seu conteúdo aqui */}</div>
    </main>
  )
}
