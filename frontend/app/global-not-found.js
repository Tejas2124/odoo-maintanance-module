import { Manrope } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
})

export const metadata = {
  title: '404 - Hallucination Detected',
  description: 'The AI made this up.',
}

export default function GlobalNotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} antialiased min-h-screen bg-background text-foreground flex flex-col items-center justify-center overflow-hidden`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <div className="text-center px-6">
            <h1 className="text-6xl font-extrabold mb-4">404</h1>
            <Button href="/" variant="primary" size="lg">
              Go Back Home
            </Button>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}