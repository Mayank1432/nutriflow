import { useState, type ReactNode } from 'react'
import BottomNav from './BottomNav'
import { DrawerProvider } from './DrawerContext'
import HamburgerDrawer, { type DrawerDestination } from './HamburgerDrawer'

export type TabId = 'today' | 'weekly' | 'history' | 'more'

type AppShellProps = {
  activeTab: TabId
  children: ReactNode
  onTabChange: (tab: TabId) => void
  activeDestination: DrawerDestination
  onDrawerNavigate: (destination: DrawerDestination) => void
}

function AppShell({ activeTab, children, onTabChange, activeDestination, onDrawerNavigate }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  return (
    <DrawerProvider value={() => setDrawerOpen(true)}>
    <div className="app-frame">
      <main className="app-main">{children}</main>
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
      <HamburgerDrawer
        activeDestination={activeDestination}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={onDrawerNavigate}
      />
    </div>
    </DrawerProvider>
  )
}

export default AppShell
