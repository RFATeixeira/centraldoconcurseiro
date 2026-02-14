'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  HomeIcon,
  AcademicCapIcon,
  ChatBubbleLeftIcon,
  UserIcon,
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'

export default function MobileNavBar() {
  const router = useRouter()
  const pathname = usePathname()

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/not-found'

  const isChatPage = pathname === '/chat'

  if (isAuthPage || isChatPage) {
    return null
  }

  return (
    <>
      {/* Back Button - Topo */}
      {pathname !== '/' && (
        <button
          onClick={() => router.back()}
          className="md:hidden fixed top-4 left-4 z-200 glassmorphism-pill rounded-full p-3"
          aria-label="Voltar"
        >
          <ArrowLeftIcon className="h-5 w-5 text-white" />
        </button>
      )}

      {/* NavBar Flutuante - Fundo */}
      <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-500">
        <div className="bg-black/60 backdrop-blur-[0.2rem] border border-white/10 rounded-full px-4 py-3 flex items-center gap-6 shadow-2xl">
          <Link
            href="/"
            className={`p-2 rounded-full transition-all ${
              pathname === '/'
                ? 'bg-cyan-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Início"
          >
            <HomeIcon className="h-8 w-8" />
          </Link>

          <Link
            href="/concursos-disponiveis"
            className={`p-2 rounded-full transition-all ${
              pathname.includes('concursos')
                ? 'bg-cyan-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Concursos"
          >
            <AcademicCapIcon className="h-8 w-8" />
          </Link>

          <Link
            href="/simulados"
            className={`p-2 rounded-full transition-all ${
              pathname === '/simulados'
                ? 'bg-cyan-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Simulados"
          >
            <ClipboardDocumentListIcon className="h-7 w-7" />
          </Link>

          <Link
            href="/chat"
            className={`p-2 rounded-full transition-all ${
              pathname === '/chat'
                ? 'bg-cyan-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Chat"
          >
            <ChatBubbleLeftIcon className="h-8 w-8" />
          </Link>

          <Link
            href="/perfil"
            className={`p-2 rounded-full transition-all ${
              pathname === '/perfil'
                ? 'bg-cyan-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Perfil"
          >
            <UserIcon className="h-8 w-8" />
          </Link>
        </div>
      </nav>
    </>
  )
}
