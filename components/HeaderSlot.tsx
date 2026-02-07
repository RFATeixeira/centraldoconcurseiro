'use client'

import Header from './Header'
import { useHeader } from '../app/context/HeaderContext'
import { useUI } from '../app/context/UIContext'

export default function HeaderSlot() {
  const { showHeader } = useHeader()
  const { showHeader: showUIHeader } = useUI()

  if (!showHeader || !showUIHeader) {
    return null
  }

  return <Header />
}
