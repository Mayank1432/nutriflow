import { useState } from 'react'
import AppShell, { type TabId } from './components/AppShell'
import HistoryScreen from './screens/HistoryScreen'
import MoreScreen from './screens/MoreScreen'
import TodayScreen from './screens/TodayScreen'
import WeeklyScreen from './screens/WeeklyScreen'
import SettingsScreen from './screens/SettingsScreen'

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('today')
  const [showSettings, setShowSettings] = useState(false)

  const screens = {
    today: <TodayScreen />,
    weekly: <WeeklyScreen />,
    history: <HistoryScreen />,
    more: showSettings
      ? <SettingsScreen onBack={() => setShowSettings(false)} />
      : <MoreScreen onOpenSettings={() => setShowSettings(true)} />,
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={(tab) => {
      setActiveTab(tab)
      if (tab !== 'more') setShowSettings(false)
    }}>
      {screens[activeTab]}
    </AppShell>
  )
}

export default App
