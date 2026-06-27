import type { TabId } from './AppShell'
import NavItem from './NavItem'

type BottomNavProps = {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const items: Array<{ id: TabId; icon: string; label: string }> = [
  { id: 'today', icon: '●', label: 'Today' },
  { id: 'weekly', icon: '▦', label: 'Weekly' },
  { id: 'history', icon: '◷', label: 'History' },
  { id: 'more', icon: '•••', label: 'More' },
]

function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {items.map((item) => (
        <NavItem
          key={item.id}
          {...item}
          active={activeTab === item.id}
          onSelect={() => onTabChange(item.id)}
        />
      ))}
    </nav>
  )
}

export default BottomNav
