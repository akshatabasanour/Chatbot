import './globals.css'
import CursorParticles from './components/CursorParticles'

export const metadata = {
  title: 'Silver Query UI',
  description: 'Premium Silver AI Chatbot Query Interface',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CursorParticles />
        {children}
      </body>
    </html>
  )
}
