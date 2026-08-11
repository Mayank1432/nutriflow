import { useCallback, useRef, useState } from 'react'
import AppShell, { type TabId } from './components/AppShell'
import HistoryScreen from './screens/HistoryScreen'
import MoreScreen from './screens/MoreScreen'
import TodayScreen from './screens/TodayScreen'
import WeeklyScreen from './screens/WeeklyScreen'
import SettingsScreen from './screens/SettingsScreen'
import AnalyticsScreen from './screens/AnalyticsScreen'
import PantryScreen from './screens/PantryScreen'
import { readReactSettingsStore, writeReactSettingsStore, type MacroGoals } from './storage'
import type { DrawerDestination } from './components/HamburgerDrawer'

type UiIntent = {
  type: 'quick-add' | 'today-ingredients' | 'ingredient-library' | 'daily-staples' | 'custom-ingredient' | 'macro-goals' | 'theme'
  token: number
}

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('today')
  const [showSettings, setShowSettings] = useState(false)
  const [moreSection, setMoreSection] = useState<'ingredient-library' | 'daily-staples' | null>(null)
  const [showPantry, setShowPantry] = useState(false)
  const [settings, setSettings] = useState(() => readReactSettingsStore())
  const [uiIntent, setUiIntent] = useState<UiIntent | null>(null)
  const [quickAddVisible, setQuickAddVisible] = useState(false)
  const intentSequence = useRef(0)

  const issueIntent = useCallback((type: UiIntent['type']) => {
    intentSequence.current += 1
    setUiIntent({ type, token: intentSequence.current })
  }, [])

  const consumeIntent = useCallback((token: number) => {
    setUiIntent((current) => current?.token === token ? null : current)
  }, [])

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
    today: <TodayScreen
      intent={uiIntent?.type === 'quick-add' || uiIntent?.type === 'today-ingredients'
        ? { type: uiIntent.type, token: uiIntent.token }
        : null}
      onIntentConsumed={consumeIntent}
      onOpenDailyStaples={() => navigateDrawer('daily-staples')}
      onOpenIngredientLibrary={() => navigateDrawer('ingredient-library')}
      onQuickAddVisibilityChange={setQuickAddVisible}
    />,
    weekly: <WeeklyScreen />,
    history: <HistoryScreen />,
    analytics: <AnalyticsScreen />,
    more: showPantry ? <PantryScreen /> : showSettings
      ? <SettingsScreen
          onBack={() => setShowSettings(false)}
          settings={settings}
          onToggleTheme={toggleTheme}
          onSaveMacroGoals={saveMacroGoals}
          focusSection={uiIntent?.type === 'macro-goals' || uiIntent?.type === 'theme'
            ? { type: uiIntent.type, token: uiIntent.token }
            : null}
          onFocusConsumed={consumeIntent}
        />
      : <MoreScreen
          onOpenSettings={() => setShowSettings(true)}
          focusSection={moreSection}
          intent={uiIntent?.type === 'ingredient-library' || uiIntent?.type === 'daily-staples' || uiIntent?.type === 'custom-ingredient'
            ? { type: uiIntent.type, token: uiIntent.token }
            : null}
          onIntentConsumed={consumeIntent}
        />,
  }

  const navigateDrawer = (destination: DrawerDestination) => {
    setUiIntent(null)
    setShowPantry(false)
    if (destination === 'pantry') {
      setActiveTab('more'); setShowSettings(false); setMoreSection(null); setShowPantry(true); return
    }
    if (destination === 'quick-add' || destination === 'today-ingredients') {
      setActiveTab('today'); setShowSettings(false); setMoreSection(null); issueIntent(destination); return
    }
    if (destination === 'custom-ingredient') {
      setActiveTab('more'); setShowSettings(false); setMoreSection('ingredient-library'); issueIntent(destination); return
    }
    if (destination === 'macro-goals' || destination === 'theme') {
      setActiveTab('more'); setShowSettings(true); setMoreSection(null); issueIntent(destination); return
    }
    if (destination === 'analytics') {
      setActiveTab('analytics'); setShowSettings(false); setMoreSection(null); return
    }
    if (destination === 'settings') {
      setActiveTab('more'); setShowSettings(true); setMoreSection(null); return
    }
    if (destination === 'ingredient-library' || destination === 'daily-staples') {
      setActiveTab('more'); setShowSettings(false); setMoreSection(destination)
      issueIntent(destination)
      return
    }
    setActiveTab(destination)
    setShowSettings(false)
    setMoreSection(null)
  }
  const activeDestination: DrawerDestination = showPantry
    ? 'pantry'
    : showSettings
    ? 'settings'
    : moreSection ?? activeTab

  return (
    <div className="theme-root" data-theme={settings.theme.mode}>
    <AppShell activeTab={activeTab} hideBottomNavigation={quickAddVisible} onTabChange={(tab) => {
      setUiIntent(null)
      setShowPantry(false)
      setActiveTab(tab)
      if (tab !== 'more') setShowSettings(false)
    }} activeDestination={activeDestination} onDrawerNavigate={navigateDrawer}>
      {screens[activeTab]}
    </AppShell>
    </div>
  )
}

export default App
