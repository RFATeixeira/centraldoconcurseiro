import type { Metadata, Viewport } from 'next'
// eslint-disable-next-line camelcase
import { Geist, Geist_Mono, Comfortaa } from 'next/font/google'
import './globals.css'
import GlassBackground from '../components/GlassBackground'
import HeaderSlot from '../components/HeaderSlot'
import AuthGuard from '../components/AuthGuard'
import NavigationLoading from '../components/NavigationLoading'
import MobileNavBar from '../components/MobileNavBar'
import { AuthProvider } from './context/AuthContext'
import { HeaderProvider } from './context/HeaderContext'
import { UIProvider } from './context/UIContext'
import Footer from '../components/Footer'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const comfortaa = Comfortaa({
  variable: '--font-comfortaa',
  subsets: ['latin'],
  weight: ['300', '400', '700'],
})

export const metadata: Metadata = {
  title: 'Central do Concurseiro',
  description: 'Plataforma de centralização para concurseiros',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootAppTestLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#06b6d4" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Concurseiro" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${comfortaa.variable} antialiased relative min-h-screen flex flex-col overflow-x-hidden`}
      >
        <div className="safe-area-blur" />
        <NavigationLoading />
        <GlassBackground />
        <UIProvider>
          <AuthProvider>
            <HeaderProvider>
              <HeaderSlot />
              <AuthGuard>
                <div className="flex-1">{children}</div>
              </AuthGuard>
              <MobileNavBar />
              {/* Footer só aparece em desktop */}
              <div className="hidden md:block">
                <Footer />
              </div>
            </HeaderProvider>
          </AuthProvider>
        </UIProvider>
      </body>
    </html>
  )
}
