'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../app/context/AuthContext'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ChartBarIcon } from '@heroicons/react/24/solid'

interface DiaProgresso {
  dia: string
  questoes: number
}

export default function ProgressoEstudosCard() {
  const { user } = useAuth()
  const questoesSemanais = 200
  const [questoesCompletadas, setQuestoesCompletadas] = useState(0)
  const [progressoPorDia, setProgressoPorDia] = useState<DiaProgresso[]>([])
  const [percentual, setPercentual] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [proximoReset, setProximoReset] = useState<string>('')

  // Função para calcular próximo reset (segunda-feira às 08:00)
  const calcularProximoReset = () => {
    const agora = new Date()
    const diaSemana = agora.getDay()
    const hora = agora.getHours()

    let proximaSegunda: Date

    // Se é segunda-feira e ainda não passou das 08:00
    if (diaSemana === 1 && hora < 8) {
      proximaSegunda = new Date(agora)
      proximaSegunda.setHours(8, 0, 0, 0)
    } else {
      // Próxima segunda-feira às 08:00
      proximaSegunda = new Date(agora)
      const diasAteSemana = diaSemana === 0 ? 1 : 8 - diaSemana
      proximaSegunda.setDate(agora.getDate() + diasAteSemana)
      proximaSegunda.setHours(8, 0, 0, 0)
    }

    return proximaSegunda.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  useEffect(() => {
    // Calcular e exibir próximo reset
    setProximoReset(calcularProximoReset())

    if (!user) {
      setCarregando(false)
      return
    }

    const carregarDados = async () => {
      try {
        // Buscar respostas do usuário para calcular progresso
        const respostasRef = collection(
          db,
          'users',
          user.uid,
          'respostas_simulados',
        )
        const respostasDocs = await getDocs(respostasRef)

        // Calcular a semana atual (segunda-feira até domingo)
        // Reset automático: semana sempre começa segunda-feira da semana atual
        const hoje = new Date()
        const diaSemana = hoje.getDay()
        const segundaFeira = new Date(hoje)
        segundaFeira.setDate(
          hoje.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1),
        )
        segundaFeira.setHours(0, 0, 0, 0)

        const proximoSegunda = new Date(segundaFeira)
        proximoSegunda.setDate(segundaFeira.getDate() + 7)

        // Filtrar respostas da semana atual
        const respostasSemanais = respostasDocs.docs.filter((doc) => {
          const dados = doc.data()
          if (!dados.timestamp) return false
          const dataResposta = dados.timestamp.toDate
            ? dados.timestamp.toDate()
            : new Date(dados.timestamp)
          return dataResposta >= segundaFeira && dataResposta < proximoSegunda
        })

        // Contar questões respondidas na semana
        const totalQuestoes = respostasSemanais.length
        const questoesRestringidas = Math.min(totalQuestoes, questoesSemanais)

        console.log(
          `📊 Progresso carregado: ${totalQuestoes} questões respondidas esta semana`,
        )

        setQuestoesCompletadas(questoesRestringidas)
        setPercentual(
          Math.round((questoesRestringidas / questoesSemanais) * 100),
        )

        // Calcular distribuição por dia da semana baseado em timestamps
        const distribuicaoPorDia: number[] = []
        for (let i = 0; i < 7; i++) {
          distribuicaoPorDia.push(0)
        }

        respostasSemanais.forEach((doc) => {
          const dados = doc.data()
          if (dados.timestamp) {
            const data = dados.timestamp.toDate
              ? dados.timestamp.toDate()
              : new Date(dados.timestamp)
            const diaSemana = data.getDay()
            // JavaScript: 0 = Domingo, convertemos para 0 = Segunda
            const diaAjustado = diaSemana === 0 ? 6 : diaSemana - 1
            ;(distribuicaoPorDia as number[])[diaAjustado] += 1
          }
        })

        const diasData = [
          { dia: 'Seg', questoes: distribuicaoPorDia[0] },
          { dia: 'Ter', questoes: distribuicaoPorDia[1] },
          { dia: 'Qua', questoes: distribuicaoPorDia[2] },
          { dia: 'Qui', questoes: distribuicaoPorDia[3] },
          { dia: 'Sex', questoes: distribuicaoPorDia[4] },
          { dia: 'Sab', questoes: distribuicaoPorDia[5] },
          { dia: 'Dom', questoes: distribuicaoPorDia[6] },
        ]

        setProgressoPorDia(diasData)
      } catch (error) {
        console.error('Erro ao carregar progresso:', error)
        // Em caso de erro, usar dados padrão
        setQuestoesCompletadas(0)
        setPercentual(0)
        setProgressoPorDia([
          { dia: 'Seg', questoes: 0 },
          { dia: 'Ter', questoes: 0 },
          { dia: 'Qua', questoes: 0 },
          { dia: 'Qui', questoes: 0 },
          { dia: 'Sex', questoes: 0 },
          { dia: 'Sab', questoes: 0 },
          { dia: 'Dom', questoes: 0 },
        ])
      } finally {
        setCarregando(false)
      }
    }

    // Carregar dados inicialmente
    carregarDados()

    // Configurar listener para atualizações em tempo real
    const respostasRef = collection(
      db,
      'users',
      user.uid,
      'respostas_simulados',
    )

    const unsubscribe = onSnapshot(
      respostasRef,
      () => {
        carregarDados()
      },
      (error) => {
        console.error('Erro ao escutar respostas:', error)
      },
    )

    return unsubscribe
  }, [user])

  if (!user || carregando) {
    return (
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 ring-2 ring-white/10 h-full flex items-center justify-center">
        <p className="text-white/60">Carregando progresso...</p>
      </div>
    )
  }

  const pieData = [
    { name: 'Completado', value: questoesCompletadas, fill: '#06b6d4' },
    {
      name: 'Restante',
      value: Math.max(0, questoesSemanais - questoesCompletadas),
      fill: '#164e63',
    },
  ]

  return (
    <div className="w-full md:w-80 max-w-full card-style-1">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
        <div className="p-2 bg-linear-to-br from-cyan-400/20 to-cyan-500/20 rounded-full">
          <div className="h-6 w-6 text-cyan-300 flex items-center justify-center">
            <ChartBarIcon className="h-6 w-6 text-cyan-300" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">Meu Progresso</h3>
          <p className="text-xs text-gray-400">Questões respondidas</p>
        </div>
      </div>

      {/* Informação de Reset */}
      <div className="mb-4 p-3 bg-cyan-400/10 border border-cyan-400/30 rounded-lg">
        <p className="text-xs text-cyan-300">
          ↻ Reseta: <span className="font-semibold">{proximoReset}</span>
        </p>
      </div>

      {/* Progresso Circular Menor */}
      <div className="flex gap-4 items-center justify-center mb-6">
        <div className="relative w-90 h-34 flex items-center justify-center z-100">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Texto no centro */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-white">{percentual}%</p>
            <p className="text-xs text-white/70">da meta</p>
          </div>
        </div>

        <div className="-translate-x-10 w-70 bg-black/40 rounded-3xl p-4 flex justify-end">
          <div className="text-white flex flex-col">
            <div className="flex gap-2">
              <span className="text-xl font-bold text-cyan-300">
                {questoesCompletadas}
              </span>
              <span className="text-xl font-bold text-cyan-700">
                / {questoesSemanais}
              </span>
            </div>
            <span className="text-white/70 text-sm">questões</span>
          </div>
        </div>
      </div>

      {/* Distribuição por Dia */}
      <div className="space-y-2 border-t border-white/10 pt-4">
        <p className="text-xs text-gray-300 uppercase tracking-wider font-semibold mb-2">
          Distribuição
        </p>
        <div className="w-full h-30">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={progressoPorDia}
              margin={{ top: 10, right: 10, bottom: -20, left: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="dia"
                stroke="rgba(255,255,255,0.3)"
                height={40}
                fontSize={11}
                angle={0}
              />
              <Tooltip
                cursor={false}
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '2px solid rgba(6,182,212,0.4)',
                  borderRadius: '6px',
                  backdropFilter: 'blur(10px)',
                }}
                labelStyle={{
                  color: '#fff',
                  fontSize: '12px',
                }}
                itemStyle={{
                  color: '#fff',
                  fontSize: '13px',
                }}
                formatter={(value) => `${value} q`}
              />
              <Bar
                dataKey="questoes"
                radius={[16, 16, 0, 0]}
                isAnimationActive={false}
                activeBar={{ fill: '#22d3ee' }} // cor quando hover
              >
                {progressoPorDia.map((entry, index) => {
                  const colors = [
                    '#0c4a6e', // Seg - cyan-900
                    '#164e63', // Ter - cyan-800
                    '#155e75', // Qua - cyan-700
                    '#0e7490', // Qui - cyan-600
                    '#0891b2', // Sex - cyan-500
                    '#06b6d4', // Sab - cyan-400
                    '#22d3ee', // Dom - cyan-300
                  ]
                  return <Cell key={`cell-${index}`} fill={colors[index]} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
