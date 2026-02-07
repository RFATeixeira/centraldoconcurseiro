'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface HeaderContextType {
  showHeader: boolean
  hideHeader: () => void
  showHeaderAgain: () => void
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined)

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [showHeader, setShowHeader] = useState(true)

  const hideHeader = () => setShowHeader(false)
  const showHeaderAgain = () => setShowHeader(true)

  return (
    <HeaderContext.Provider value={{ showHeader, hideHeader, showHeaderAgain }}>
      {children}
    </HeaderContext.Provider>
  )
}

export function useHeader() {
  const context = useContext(HeaderContext)
  if (!context) {
    throw new Error('useHeader deve ser usado dentro de HeaderProvider')
  }
  return context
}
