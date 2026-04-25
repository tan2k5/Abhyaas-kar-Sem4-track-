import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StudyOS — APSIT 2026',
  description: 'Exam prep command center',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      {/* 1. Removed the inline flex from body (handle that in page.tsx)
          2. Added margin: 0 to prevent white gaps
          3. Set height to 100% 
      */}
      <body style={{ 
        margin: 0, 
        padding: 0, 
        height: '100vh', 
        width: '100vw', 
        overflow: 'hidden',
        backgroundColor: '#F9FAFB' 
      }}>
        {children}
      </body>
    </html>
  )
}