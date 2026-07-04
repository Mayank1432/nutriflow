import { useState } from 'react'
import AppShell, { type TabId } from './components/AppShell'
import HistoryScreen from './screens/HistoryScreen'
import MoreScreen from './screens/MoreScreen'
import TodayScreen from './screens/TodayScreen'
import WeeklyScreen from './screens/WeeklyScreen'
import SettingsScreen from './screens/SettingsScreen'
import AnalyticsScreen from './screens/AnalyticsScreen'
import { readReactSettingsStore, writeReactSettingsStore, type MacroGoals } from './storage'
import type { DrawerDestination } from './components/HamburgerDrawer'

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('today')
  const [showSettings, setShowSettings] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [moreSection, setMoreSection] = useState<'ingredient-library' | 'daily-staples' | null>(null)
  const [settings, setSettings] = useState(() => readReactSettingsStore())

  const toggleTheme = () => {
    const updated = {
      ...settings,
      updatedAt: new Date().toISOString(),
      theme: { mode: settings.theme.mode === 'light' ? 'dark' as const : 'light' as const },
    }
    if (writeReactSettingsStore(updated)) setSettings(updated)
  }

  const saveMacroGoals = (macroGoals: MacroGoals): boolean => {
    const updated = {
      ...settings,
      updatedAt: new Date().toISOString(),
      macroGoals,
    }
    if (!writeReactSettingsStore(updated)) return false
    setSettings(updated)
    return true
  }

  const screens = {
    today: <TodayScreen />,
    weekly: <WeeklyScreen />,
    history: <HistoryScreen />,
    more: showAnalytics
      ? <AnalyticsScreen />
      : showSettings
      ? <SettingsScreen
          onBack={() => setShowSettings(false)}
          settings={settings}
          onToggleTheme={toggleTheme}
          onSaveMacroGoals={saveMacroGoals}
        />
      : <MoreScreen onOpenSettings={() => setShowSettings(true)} focusSection={moreSection} />,
  }

  const navigateDrawer = (destination: DrawerDestination) => {
    if (destination === 'analytics') {
      setActiveTab('more'); setShowAnalytics(true); setShowSettings(false); setMoreSection(null); return
    }
    if (destination === 'settings') {
      setActiveTab('more'); setShowAnalytics(false); setShowSettings(true); setMoreSection(null); return
    }
    if (destination === 'ingredient-library' || destination === 'daily-staples') {
      setActiveTab('more'); setShowAnalytics(false); setShowSettings(false); setMoreSection(destination); return
    }
    setActiveTab(destination)
    setShowAnalytics(false)
    setShowSettings(false)
    setMoreSection(null)
  }
  const activeDestination: DrawerDestination = showAnalytics
    ? 'analytics'
    : showSettings
    ? 'settings'
    : moreSection ?? activeTab

  return (
    <div className="theme-root" data-theme={settings.theme.mode}>
    <AppShell activeTab={activeTab} onTabChange={(tab) => {
      setActiveTab(tab)
      if (tab !== 'more') setShowSettings(false)
    }} activeDestination={activeDestination} onDrawerNavigate={navigateDrawer}>
      {screens[activeTab]}
    </AppShell>
    </div>
  )
}

export default App
