import { useState } from 'react'
import AppShell, { type TabId } from './components/AppShell'
import HistoryScreen from './screens/HistoryScreen'
import MoreScreen from './screens/MoreScreen'
import TodayScreen from './screens/TodayScreen'
import WeeklyScreen from './screens/WeeklyScreen'

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('today')

  const screens = {
    today: <TodayScreen />,
    weekly: <WeeklyScreen />,
    history: <HistoryScreen />,
    more: <MoreScreen />,
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      {screens[activeTab]}
    </AppShell>
  )
}

export default App
