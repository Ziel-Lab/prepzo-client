import type { Metadata } from 'next'
import '@fontsource-variable/inter'
import '../styles/ripple.css'
import './globals.css'

import { Provider } from './provider'
import { ColorModeInitializer } from '@/theme/colormodescript'

export const metadata: Metadata = {
  title: 'Prepzo AI Coach',
  description: 'AI coaching for personal growth',
  icons: {
    apple: [
      { url: '/static/favicons/apple-touch-icon.png', sizes: '76x76', type: 'image/png' },
    ],
    icon: [
      { url: '/static/favicons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/static/favicons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    other: [
      { rel: 'manifest', url: '/static/favicons/manifest.json' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorModeInitializer />
      </head>
      <body className="chakra-ui-light">
        <Provider>{children}</Provider>
      </body>
    </html>
  )
} 