import { Inter, Geist } from 'next/font/google'
import './globals.css'
import Sidebar from '../components/Sidebar'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'SkyOps — Flight Management',
  description: 'Professional Flight Operations Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={inter.className} style={{
        background: 'linear-gradient(135deg, #0A0F2E 0%, #0D1B4B 50%, #0A2463 100%)',
        minHeight: '100vh'
      }}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}