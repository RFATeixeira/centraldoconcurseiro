'use client'

import { TrophyIcon } from '@heroicons/react/24/outline'

interface Ranking {
  concurso: string
  posicao: number
  totalCandidatos: number
  ano: string
  pontos: number
}

interface TopRankingsCardProps {
  rankings?: Ranking[]
}

export default function TopRankingsCard({
  rankings = [],
}: TopRankingsCardProps) {
  const getMedalColor = (index: number) => {
    switch (index) {
      case 0:
        return 'from-cyan-400 to-cyan-500' // Ouro
      case 1:
        return 'from-cyan-500 to-cyan-600' // Prata
      case 2:
        return 'from-cyan-600 to-cyan-700' // Bronze
      default:
        return 'from-cyan-700 to-cyan-800' // Padrão
    }
  }

  const getMedalTextColor = (index: number) => {
    switch (index) {
      case 0:
        return 'text-cyan-400'
      case 1:
        return 'text-cyan-600'
      case 2:
        return 'text-cyan-800'
      default:
        return 'text-cyan-400'
    }
  }

  return (
    <div className="w-full md:w-80 max-w-full card-style-1 h-full justify-between flex-col flex">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
        <div className="p-2 bg-linear-to-br from-cyan-400/20 to-blue-500/20 rounded-full">
          <TrophyIcon className="h-6 w-6 text-cyan-300" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">
            Melhores Classificações
          </h3>
          <p className="text-xs text-gray-400">Seus maiores destaques</p>
        </div>
      </div>

      {/* Lista de Rankings */}
      <div className="space-y-3">
        {rankings.length === 0 ? (
          <div className="text-center py-8">
            <TrophyIcon className="h-12 w-12 text-gray-500 mx-auto mb-3 opacity-50" />
            <p className="text-sm text-gray-400">
              Nenhuma classificação registrada ainda
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Suas conquistas aparecerão aqui
            </p>
          </div>
        ) : (
          rankings.slice(0, 3).map((ranking, index) => (
            <div
              key={index}
              className="relative p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200"
            >
              {/* Badge de posição */}
              <div className="absolute -top-2 -left-2">
                <div
                  className={`w-6 h-6 rounded-full bg-linear-to-br ${getMedalColor(
                    index,
                  )} flex items-center justify-center text-xs font-bold text-white shadow-lg`}
                >
                  {index + 1}
                </div>
              </div>

              {/* Conteúdo */}
              <div className="ml-2">
                <h4 className="text-sm font-semibold text-white mb-1 line-clamp-1">
                  {ranking.concurso}
                </h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-lg font-bold ${getMedalTextColor(index)}`}
                    >
                      {ranking.posicao}º
                    </span>
                    <span className="text-xs text-gray-400">
                      de {ranking.totalCandidatos.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className=" flex gap-2">
                    <span className="text-xs text-cyan-400 bg-white/5 px-2 py-1 rounded-full">
                      {ranking.pontos} pts
                    </span>
                    <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full">
                      {ranking.ano}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer com informação adicional */}
      {rankings.length > 0 && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-xs text-center text-gray-400">
            Exibindo {Math.min(rankings.length, 3)} de {rankings.length}{' '}
            {rankings.length === 1 ? 'classificação' : 'classificações'}
          </p>
        </div>
      )}
    </div>
  )
}
