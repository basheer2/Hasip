import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
// Cairo font bundled locally (no network needed at build/runtime — required for the Android app)
import '@fontsource/cairo/400.css'
import '@fontsource/cairo/500.css'
import '@fontsource/cairo/600.css'
import '@fontsource/cairo/700.css'
import '@fontsource/cairo/800.css'
import '@fontsource/cairo/900.css'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { ThemeScript } from '@/components/theme-script'

export const metadata: Metadata = {
  title: 'الحساب اليومي - نظام محاسبي لفني الكهرباء',
  description:
    'نظام محاسبي شخصي احترافي لفني الكهرباء لمتابعة أيام العمل والمستحقات والمدفوعات مع المقاولين. يعمل بدون إنترنت.',
  generator: 'v0.app',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'الحساب اليومي',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#1e293b' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" className="bg-background" suppressHydrationWarning>
      <head>
        <ThemeScript />
        {/* Offline PWA support (browser only — the Android WebView keeps its own cache) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator && !window.Capacitor) { window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}) }) }`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-center" richColors />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
