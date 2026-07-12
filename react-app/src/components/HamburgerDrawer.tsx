import { useEffect, useState } from 'react'

export type DrawerDestination =
  | 'today' | 'weekly' | 'history' | 'more'
  | 'analytics' | 'ingredient-library' | 'daily-staples' | 'settings'
  | 'quick-add' | 'today-ingredients' | 'custom-ingredient'
  | 'macro-goals' | 'theme'

type HamburgerDrawerProps = {
  activeDestination: DrawerDestination
  open: boolean
  onClose: () => void
  onNavigate: (destination: DrawerDestination) => void
}

type DrawerLink = {
  id: string
  label: string
  destination?: DrawerDestination
  activeFor?: DrawerDestination
}

const groups: Array<{ label: string; links: DrawerLink[] }> = [
  {
    label: 'Main',
    links: [
      { id: 'today', label: 'Today', destination: 'today', activeFor: 'today' },
      { id: 'quick-add', label: 'Quick Add', destination: 'quick-add' },
      { id: 'analytics', label: 'Analytics', destination: 'analytics', activeFor: 'analytics' },
      { id: 'weekly-planner', label: 'Weekly Planner', destination: 'weekly', activeFor: 'weekly' },
      { id: 'history', label: 'History', destination: 'history', activeFor: 'history' },
      { id: 'shopping-list', label: 'Shopping List' },
      { id: 'pantry-stock', label: 'Pantry / Stock' },
    ],
  },
  {
    label: 'Today Tools',
    links: [
      { id: 'today-ingredients', label: 'Today Ingredients', destination: 'today-ingredients' },
      { id: 'daily-staples', label: 'Daily Staples', destination: 'daily-staples', activeFor: 'daily-staples' },
      { id: 'custom-ingredient', label: 'Custom Ingredient', destination: 'custom-ingredient' },
      { id: 'cost-protein-table', label: 'Cost / Protein Table' },
    ],
  },
  {
    label: 'Account & Data',
    links: [
      { id: 'sign-in-out', label: 'Sign in / Sign out' },
      { id: 'account', label: 'Account' },
      { id: 'cloud-sync', label: 'Cloud Sync' },
      { id: 'backup-restore', label: 'Backup & Restore' },
      { id: 'multi-user-sharing', label: 'Multi-user Sharing' },
    ],
  },
  {
    label: 'Settings',
    links: [
      { id: 'settings', label: 'Settings', destination: 'settings', activeFor: 'settings' },
      { id: 'macro-goals', label: 'Macro Goals', destination: 'macro-goals' },
      { id: 'theme', label: 'Theme', destination: 'theme' },
      { id: 'app-info-help', label: 'App Info / Help' },
    ],
  },
]

function HamburgerDrawer({ activeDestination, open, onClose, onNavigate }: HamburgerDrawerProps) {
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (!open) return
    setFeedback('')
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="drawer-overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <aside className="hamburger-drawer" role="dialog" aria-modal="true" aria-label="Navigation menu">
        <div className="drawer-heading">
          <strong>NutriFlow</strong>
          <button type="button" aria-label="Close menu" onClick={onClose}>×</button>
        </div>
        <nav aria-label="Drawer navigation">
          {groups.map((group) => (
            <section key={group.label} aria-labelledby={`drawer-${group.label.toLowerCase().replaceAll(' ', '-')}`}>
              <h2 id={`drawer-${group.label.toLowerCase().replaceAll(' ', '-')}`}>{group.label}</h2>
              {group.links.map((link) => {
                const isActive = link.activeFor === activeDestination
                return (
                <button
                  key={link.id}
                  type="button"
                  className={isActive ? 'active' : link.destination ? '' : 'coming-soon'}
                  aria-current={isActive ? 'page' : undefined}
                  aria-describedby={!link.destination ? 'drawer-feedback' : undefined}
                  onClick={() => {
                    if (link.destination) {
                      onNavigate(link.destination)
                      onClose()
                      return
                    }
                    setFeedback(`${link.label} is coming soon.`)
                  }}
                >
                  <span>{link.label}</span>
                  {!link.destination && <span className="coming-soon-badge">Coming Soon</span>}
                </button>
              )})}
            </section>
          ))}
        </nav>
        <p
          className="drawer-feedback"
          id="drawer-feedback"
          role="status"
          aria-live="polite"
        >
          {feedback || 'Coming Soon items are not yet available.'}
        </p>
      </aside>
    </div>
  )
}

export default HamburgerDrawer
