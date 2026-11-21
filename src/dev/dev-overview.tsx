import { Link } from '@tanstack/react-router'

import { devPages } from './pages'

export function DevOverview() {
  return (
    <div className="max-w-2xl space-y-8">
      <header className="space-y-1">
        <h1 className="text-display font-medium">Dev playground</h1>
        <p className="text-body text-muted-foreground">
          Local-only test pages. Production builds return a 404 for every /dev URL.
        </p>
      </header>
      <ul className="divide-y divide-border">
        {devPages
          .filter((page) => page.to !== '/dev')
          .map((page) => (
            <li key={page.to}>
              <Link to={page.to} className="flex items-start gap-3 py-4 text-foreground">
                <page.icon size={16} strokeWidth={1.5} className="mt-0.5 text-muted-foreground" />
                <span className="space-y-0.5">
                  <span className="block text-subtitle font-medium">{page.label}</span>
                  <span className="block text-body text-muted-foreground">{page.description}</span>
                </span>
              </Link>
            </li>
          ))}
      </ul>
    </div>
  )
}
