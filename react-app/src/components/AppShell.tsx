import { useState, type ReactNode } from 'react'
import BottomNavigation from './BottomNavigation'
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
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setDrawerOpen(false)
          onTabChange(tab)
        }}
      />
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
