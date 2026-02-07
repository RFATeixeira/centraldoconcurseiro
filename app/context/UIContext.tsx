'use client'

import { createContext, useContext, useState } from 'react'

interface UIContextType {
  showHeader: boolean
  setShowHeader: (show: boolean) => void
}

const UIContext = createContext<UIContextType>({
  showHeader: true,
  setShowHeader: () => {},
})

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [showHeader, setShowHeader] = useState(true)

  return (
    <UIContext.Provider value={{ showHeader, setShowHeader }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  return useContext(UIContext)
}
