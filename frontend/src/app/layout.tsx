import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { AudioPlayerProvider } from '@/components/player/AudioPlayerProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Walkumentary',
  description: 'Personalized AI-powered audio tours for travelers',
  manifest: '/manifest.json',
  icons: { 
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/walkumentary_icon_new.png', sizes: '1024x1024', type: 'image/png' }
    ]
  },
  openGraph: {
    images: ['/walkumentary_icon_new.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AudioPlayerProvider>
            {children}
          </AudioPlayerProvider>
        </AuthProvider>
      </body>
    </html>
  )
}