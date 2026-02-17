'use client'

import { useState } from 'react'
import Image from 'next/image'
import { PencilIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../app/context/AuthContext'
import Link from 'next/link'

interface ConcursoStats {
  emAndamento: number
  inscritos: number
  finalizados: number
}

export default function UserConcursoCard({
  stats = { emAndamento: 0, inscritos: 0, finalizados: 0 },
}: {
  stats?: ConcursoStats
}) {
  const { profile, profileLoading } = useAuth()
  const [isHovering, setIsHovering] = useState(false)

  if (profileLoading) {
    return (
      <div className="w-full md:w-80 max-w-full h-96 bg-linear-to-br from-gray-500/20 to-gray-500/20 rounded-2xl backdrop-blur-md border border-white/20 p-6 animate-pulse" />
    )
  }

  return (
    <div
      className="w-full md:w-80 max-w-full card-style-1 relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Botão Editar */}
      <div className="absolute top-2 right-2 pointer-events-none">
        {isHovering && (
          <div className="p-2 bg-black/20 backdrop-blur-[0.2rem] hover:ring-cyan-300/60 ring-2 ring-white/10 rounded-full transition-colors duration-200 shadow-lg pointer-events-auto">
            <Link href="/perfil" aria-label="Editar perfil">
              <PencilIcon className="h-4 w-4 text-white" />
            </Link>
          </div>
        )}
      </div>
      {/* Header com Avatar */}
      <div className="flex flex-col items-center mb-2">
        {profile?.photo ? (
          <Image
            src={profile.photo}
            alt="Foto do perfil"
            width={80}
            height={80}
            className="w-20 h-20 rounded-full object-cover mb-3"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mb-3">
            {profile?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
        <h3 className="text-lg font-semibold text-white text-center">
          {profile?.name || 'Usuário'}
        </h3>
      </div>

      {/* Estatísticas de Concursos */}
      <div className="space-y-2 border-t border-white/10 pt-4">
        <p className="text-xs text-gray-300 uppercase tracking-wider font-semibold mb-3">
          Meus Concursos
        </p>

        <div className="flex items-center justify-between p-3 bg-cyan-400/20 rounded-full border border-cyan-400/30">
          <span className="text-sm text-gray-200">Em Andamento</span>
          <span className="text-lg font-bold text-cyan-300">
            {stats.emAndamento}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-cyan-600/20 rounded-full border border-cyan-400/30">
          <span className="text-sm text-gray-200">Inscritos</span>
          <span className="text-lg font-bold text-cyan-300">
            {stats.inscritos}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-cyan-800/20 rounded-full border border-cyan-400/30">
          <span className="text-sm text-gray-200">Finalizados</span>
          <span className="text-lg font-bold text-cyan-300">
            {stats.finalizados}
          </span>
        </div>
      </div>
    </div>
  )
}
