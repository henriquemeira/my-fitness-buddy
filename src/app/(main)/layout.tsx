import { MobileNav } from '@/components/layout/mobile-nav'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen pb-20">
      <main className="max-w-lg mx-auto">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}
