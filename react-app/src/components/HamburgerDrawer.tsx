import { useEffect } from 'react'

export type DrawerDestination =
  | 'today' | 'weekly' | 'history' | 'more'
  | 'analytics' | 'ingredient-library' | 'daily-staples' | 'settings'

type HamburgerDrawerProps = {
  activeDestination: DrawerDestination
  open: boolean
  onClose: () => void
  onNavigate: (destination: DrawerDestination) => void
}

const groups: Array<{ label: string; links: Array<[DrawerDestination, string]> }> = [
  { label: 'Main', links: [['today', 'Today'], ['weekly', 'Weekly'], ['history', 'History'], ['more', 'More']] },
  { label: 'Tools', links: [['analytics', 'Analytics'], ['ingredient-library', 'Ingredient Library'], ['daily-staples', 'Daily Staples']] },
  { label: 'Settings', links: [['settings', 'Settings']] },
]

function HamburgerDrawer({ activeDestination, open, onClose, onNavigate }: HamburgerDrawerProps) {
  useEffect(() => {
    if (!open) return
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
            <section key={group.label} aria-labelledby={`drawer-${group.label.toLowerCase()}`}>
              <h2 id={`drawer-${group.label.toLowerCase()}`}>{group.label}</h2>
              {group.links.map(([destination, label]) => (
                <button
                  key={destination}
                  type="button"
                  className={activeDestination === destination ? 'active' : ''}
                  aria-current={activeDestination === destination ? 'page' : undefined}
                  onClick={() => { onNavigate(destination); onClose() }}
                >
                  {label}
                </button>
              ))}
            </section>
          ))}
        </nav>
      </aside>
    </div>
  )
}

export default HamburgerDrawer
