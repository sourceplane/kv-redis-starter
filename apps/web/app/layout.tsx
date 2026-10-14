import './globals.css'
import { Inter } from 'next/font/google'

export const metadata = {
  title: 'KV Next.js Starter',
  description: 'A simple Next.js app with Workers KV as the database',
}

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.variable}>{children}</body>
    </html>
  )
}
