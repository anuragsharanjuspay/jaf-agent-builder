import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-semibold">
              JAF Agent Builder
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/agents" className="text-sm font-medium hover:text-primary">
                Agents
              </Link>
              <Link href="/tools" className="text-sm font-medium hover:text-primary">
                Tools
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/agents/new">
              <Button>Create Agent</Button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}