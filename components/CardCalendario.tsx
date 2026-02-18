import { useEffect, useState } from 'react'
import { collection, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'

interface ConcursoEvento {
  id: string
  nome: string
  data: Timestamp | null
}

function formatDate(date: Date) {
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getTimeDiffString(date: Date) {
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  if (diff <= 0) return 'Já ocorreu'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  let str = ''
  if (days > 0) str += `${days}d `
  if (hours > 0) str += `${hours}h `
  if (minutes > 0) str += `${minutes}m`
  return str.trim()
}

export default function CardCalendario() {
  const [eventos, setEventos] = useState<ConcursoEvento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEventos = async () => {
      const snapshot = await getDocs(collection(db, 'concursos'))
      const eventos = snapshot.docs.map((doc) => ({
        id: doc.id,
        nome: doc.data().nome,
        data: doc.data().dataProva || null,
      }))
      setEventos(eventos)
      setLoading(false)
    }
    fetchEventos()
  }, [])

  const now = new Date()
  const eventosOrdenados = [...eventos]
    .map((evento) => {
      const data = evento.data ? evento.data.toDate() : null
      const status =
        data && data.getTime() < now.getTime() ? 'Concluído' : 'Pendente'
      return { ...evento, data, status }
    })
    .sort((a, b) => {
      const dateA = a.data ? a.data.getTime() : 0
      const dateB = b.data ? b.data.getTime() : 0
      return dateA - dateB
    })

  return (
    <div className="glassmorphism-pill rounded-3xl w-full md:w-fit p-4 flex flex-col gap-4">
      <div className="flex items-center w-full gap-3 mb-2 pb-4 border-b border-white/10">
        <div className="p-2 bg-linear-to-br from-cyan-400/20 to-cyan-500/20 rounded-full">
          <div className="h-6 w-6 text-cyan-300 flex items-center justify-center">
            <CalendarDaysIcon className="h-6 w-6 text-cyan-300" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">Calendário</h3>
          <p className="text-xs text-gray-400">Eventos e concursos</p>
        </div>
      </div>
      {loading ? (
        <p className="text-gray-400">Carregando eventos...</p>
      ) : eventosOrdenados.length === 0 ? (
        <p className="text-gray-400">Nenhum evento encontrado</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {eventosOrdenados.map((evento) => (
            <li
              key={evento.id}
              className="flex flex-col bg-white/5 rounded-2xl p-3 border border-white/10 hover:bg-white/10 transition-all duration-200"
            >
              <div className="flex flex-row items-center gap-2">
                <span className="text-cyan-300 font-semibold">
                  {evento.data
                    ? `${formatDate(evento.data)} às ${formatTime(evento.data)}`
                    : 'Data não definida'}
                </span>
                <span className="text-white mx-2">|</span>
                <span className="text-white font-medium">{evento.nome}</span>
                <span className="text-white mx-2">|</span>
                <span className="text-cyan-300 font-semibold">
                  {evento.data
                    ? `${formatDate(evento.data)} às ${formatTime(evento.data)}`
                    : ''}
                </span>
              </div>
              <div className="flex flex-row items-center gap-2 mt-1">
                <span className="text-xs text-gray-400">
                  {evento.data ? getTimeDiffString(evento.data) : ''}
                </span>
                <span
                  className={`item-display-mini ml-auto ${
                    evento.status === 'Concluído'
                      ? 'bg-cyan-600 text-cyan-200'
                      : 'bg-cyan-800 text-cyan-200'
                  }`}
                >
                  {evento.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
