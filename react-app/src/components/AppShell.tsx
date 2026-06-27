import type { ReactNode } from 'react'
import BottomNav from './BottomNav'
import Header from './Header'

export type TabId = 'today' | 'weekly' | 'history' | 'more'

type AppShellProps = {
  activeTab: TabId
  children: ReactNode
  onTabChange: (tab: TabId) => void
}

function AppShell({ activeTab, children, onTabChange }: AppShellProps) {
  return (
    <div className="app-frame">
      <Header />
      <main className="app-main">{children}</main>
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  )
}

export default AppShell
