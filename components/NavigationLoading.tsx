'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import LoadingScreen from './LoadingScreen'

export default function NavigationLoading() {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()
  const previousPathname = useRef<string>('')
  const loadingTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Se é a primeira vez que carrega, não mostra loading
    if (previousPathname.current === '') {
      previousPathname.current = pathname
      return
    }

    // Se o pathname mudou, mostra loading
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname

      // Limpa timeout anterior se existir
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current)
      }

      // Só mostra loading se a página demorar mais de 300ms para carregar
      loadingTimeout.current = setTimeout(() => {
        setIsLoading(true)
      }, 300)

      // Esconde loading imediatamente quando detecta mudança (não espera mais)
      const hideTimeout = setTimeout(() => {
        setIsLoading(false)
        if (loadingTimeout.current) {
          clearTimeout(loadingTimeout.current)
        }
      }, 0)

      // Cleanup se houver outra navegação
      return () => {
        if (loadingTimeout.current) clearTimeout(loadingTimeout.current)
        clearTimeout(hideTimeout)
      }
    }
  }, [pathname])

  if (!isLoading) {
    return null
  }

  return <LoadingScreen />
}
