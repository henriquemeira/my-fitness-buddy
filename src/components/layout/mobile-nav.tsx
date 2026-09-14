'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Dumbbell, History, TrendingUp, Bot, User } from 'lucide-react'

const navItems = [
  { href: '/today', label: 'Hoje', icon: Home },
  { href: '/workouts', label: 'Treinos', icon: Dumbbell },
  { href: '/history', label: 'Histórico', icon: History },
  { href: '/evolution', label: 'Evolução', icon: TrendingUp },
  { href: '/coach', label: 'Coach', icon: Bot },
  { href: '/profile', label: 'Perfil', icon: User },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 border-zinc-800 bg-white bg-zinc-950 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center min-w-[60px] h-12 rounded-lg transition-colors',
                isActive
                  ? 'text-zinc-900 text-white'
                  : 'text-zinc-500 text-zinc-400 hover:text-zinc-700 hover:text-zinc-300'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'fill-current')} />
              <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
