'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUI } from './context/UIContext'

export default function NotFound() {
  const router = useRouter()
  const { setShowHeader } = useUI()

  useEffect(() => {
    setShowHeader(false)

    return () => {
      setShowHeader(true)
    }
  }, [setShowHeader])

  return (
    <main className="w-full min-h-screen flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-4 z-1000">
          <h1 className="text-8xl font-bold bg-linear-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-3xl font-semibold text-white">
            Página não encontrada
          </h2>
          <p className="text-gray-300 max-w-md">
            Desculpe, a página que você está procurando não existe ou foi
            movida.
          </p>
        </div>

        <div className="flex gap-4 justify-center z-1000 w-full">
          <button onClick={() => router.back()} className="button-gray ">
            Voltar
          </button>
          <Link href="/" className="button-cyan ">
            Ir para Início
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-cyan-500/20 w-full max-w-md">
          <p className="text-sm text-gray-400">
            Se você acha que isto é um erro, entre em contato com o suporte.
          </p>
        </div>
      </div>
    </main>
  )
}
