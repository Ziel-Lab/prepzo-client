import type { Metadata } from 'next'
import '@fontsource-variable/inter'
import '../styles/ripple.css'

import { Provider } from './provider'

export const metadata: Metadata = {
  title: 'Prepzo AI Coach',
  description: 'AI coaching for personal growth',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="apple-touch-icon"
          sizes="76x76"
          href="/static/favicons/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/static/favicons/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/static/favicons/favicon-16x16.png"
        />
        <link rel="manifest" href="/static/favicons/manifest.json" />
      </head>
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  )
} 