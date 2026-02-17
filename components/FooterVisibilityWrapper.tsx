"use client"

import { usePathname } from 'next/navigation'
import Footer from './Footer'

export default function FooterVisibilityWrapper() {
  const pathname = usePathname()
  if (pathname.startsWith('/chat')) return null
  return <div className="hidden md:block"><Footer /></div>
}
