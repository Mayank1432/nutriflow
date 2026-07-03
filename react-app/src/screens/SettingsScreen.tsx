import ScreenContainer from '../components/ScreenContainer'
import StatusBadge from '../components/StatusBadge'
import type { ReactSettingsStore } from '../storage'

type SettingsScreenProps = {
  onBack: () => void
  settings: ReactSettingsStore
  onToggleTheme: () => void
}

function SettingsScreen({ onBack, settings, onToggleTheme }: SettingsScreenProps) {
  const goals = [
    ['Protein', settings.macroGoals.protein.enabled, `${settings.macroGoals.protein.value ?? 120}g`],
    ['Calories', settings.macroGoals.calories.enabled, 'Disabled'],
    ['Carbs', settings.macroGoals.carbs.enabled, 'Disabled'],
    ['Fat', settings.macroGoals.fat.enabled, 'Disabled'],
    ['Fibre', settings.macroGoals.fibre.enabled, 'Disabled'],
    ['Cost', settings.macroGoals.cost.enabled, 'Disabled'],
  ] as const

  return (
    <ScreenContainer title="Settings" subtitle="Review app defaults and upcoming settings areas.">
      <button className="secondary-action" type="button" onClick={onBack}>← Back to More</button>

      <section className="about-card" aria-labelledby="theme-settings-title">
        <p className="eyebrow">Appearance</p>
        <h3 id="theme-settings-title">Theme</h3>
        <p><strong>{settings.theme.mode === 'dark' ? 'Dark' : 'Light'}</strong>{settings.theme.mode === 'light' ? ' · Default' : ''}</p>
        <button className="secondary-action" type="button" onClick={onToggleTheme}>
          Use {settings.theme.mode === 'light' ? 'Dark' : 'Light'} theme
        </button>
      </section>

      <section className="about-card" aria-labelledby="macro-goals-title">
        <p className="eyebrow">Nutrition defaults</p>
        <h3 id="macro-goals-title">Macro Goals</h3>
        {goals.map(([label, enabled, value]) => (
          <div className="summary-heading" key={label}>
            <span>{label}</span>
            <span>
              <StatusBadge variant={enabled ? 'success' : 'info'}>
                {enabled ? 'Enabled' : 'Disabled'}
              </StatusBadge>
              {' '}{value}
            </span>
          </div>
        ))}
        <p>Macro Goals are display-only in this task.</p>
      </section>

      <section className="about-card" aria-labelledby="account-settings-title">
        <p className="eyebrow">Unavailable</p>
        <h3 id="account-settings-title">Account</h3>
        <p>Accounts, login, and cloud sync are not available yet.</p>
      </section>

      <section className="about-card" aria-labelledby="data-settings-title">
        <p className="eyebrow">Unavailable</p>
        <h3 id="data-settings-title">Data</h3>
        <p>Export, import, backup, and restore controls are coming later.</p>
      </section>
    </ScreenContainer>
  )
}

export default SettingsScreen
