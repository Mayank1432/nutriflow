import { useState } from 'react'
import AppShell, { type TabId } from './components/AppShell'
import HistoryScreen from './screens/HistoryScreen'
import MoreScreen from './screens/MoreScreen'
import TodayScreen from './screens/TodayScreen'
import WeeklyScreen from './screens/WeeklyScreen'
import SettingsScreen from './screens/SettingsScreen'
import { readReactSettingsStore, writeReactSettingsStore } from './storage'

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('today')
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState(() => readReactSettingsStore())

  const toggleTheme = () => {
    const updated = {
      ...settings,
      updatedAt: new Date().toISOString(),
      theme: { mode: settings.theme.mode === 'light' ? 'dark' as const : 'light' as const },
    }
    if (writeReactSettingsStore(updated)) setSettings(updated)
  }

  const screens = {
    today: <TodayScreen />,
    weekly: <WeeklyScreen />,
    history: <HistoryScreen />,
    more: showSettings
      ? <SettingsScreen
          onBack={() => setShowSettings(false)}
          settings={settings}
          onToggleTheme={toggleTheme}
        />
      : <MoreScreen onOpenSettings={() => setShowSettings(true)} />,
  }

  return (
    <div className="theme-root" data-theme={settings.theme.mode}>
    <AppShell activeTab={activeTab} onTabChange={(tab) => {
      setActiveTab(tab)
      if (tab !== 'more') setShowSettings(false)
    }}>
      {screens[activeTab]}
    </AppShell>
    </div>
  )
}

export default App
