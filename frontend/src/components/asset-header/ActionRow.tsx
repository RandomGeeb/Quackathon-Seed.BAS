"use client"

import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Plus, ArrowLeftRight, SendHorizontal } from 'lucide-react'

const ACTIONS = [
  { href: '/add',      label: 'Add',      Icon: Plus },
  { href: '/swap',     label: 'Swap',     Icon: ArrowLeftRight },
  { href: '/transfer', label: 'Transfer', Icon: SendHorizontal },
] as const

export function ActionRow() {
  return (
    <div className="flex gap-3">
      {ACTIONS.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className={buttonVariants({ variant: 'outline' })}
        >
          <Icon className="w-4 h-4" />
          {label}
        </Link>
      ))}
    </div>
  )
}
