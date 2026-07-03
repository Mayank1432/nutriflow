import { useState } from 'react'
import ScreenContainer from '../components/ScreenContainer'
import type { MacroGoals, ReactSettingsStore } from '../storage'

type SettingsScreenProps = {
  onBack: () => void
  settings: ReactSettingsStore
  onToggleTheme: () => void
  onSaveMacroGoals: (goals: MacroGoals) => boolean
}

const goalNames = ['protein', 'calories', 'carbs', 'fat', 'fibre', 'cost'] as const
const labels = { protein: 'Protein', calories: 'Calories', carbs: 'Carbs', fat: 'Fat', fibre: 'Fibre', cost: 'Cost' }

function SettingsScreen({ onBack, settings, onToggleTheme, onSaveMacroGoals }: SettingsScreenProps) {
  const [enabled, setEnabled] = useState(() => Object.fromEntries(goalNames.map((name) => [name, settings.macroGoals[name].enabled])) as Record<typeof goalNames[number], boolean>)
  const [values, setValues] = useState(() => Object.fromEntries(goalNames.map((name) => [name, settings.macroGoals[name].value === null ? '' : String(settings.macroGoals[name].value)])) as Record<typeof goalNames[number], string>)
  const [message, setMessage] = useState('')

  const save = () => {
    const goals = {} as MacroGoals
    for (const name of goalNames) {
      if (!enabled[name]) {
        goals[name] = { enabled: false, value: null }
        continue
      }
      const value = Number(values[name])
      if (values[name].trim() === '' || !Number.isFinite(value) || value <= 0) {
        setMessage(`${labels[name]} requires a positive number.`)
        return
      }
      goals[name] = { enabled: true, value }
    }
    setMessage(onSaveMacroGoals(goals) ? 'Macro Goals saved.' : 'Macro Goals could not be saved.')
  }

  return <ScreenContainer title="Settings" subtitle="Manage app preferences and goals.">
    <button className="secondary-action" type="button" onClick={onBack}>← Back to More</button>
    <section className="about-card"><h3>Theme</h3><p><strong>{settings.theme.mode === 'dark' ? 'Dark' : 'Light'}</strong></p>
      <button className="secondary-action" type="button" onClick={onToggleTheme}>Use {settings.theme.mode === 'light' ? 'Dark' : 'Light'} theme</button>
    </section>
    <section className="about-card" aria-labelledby="macro-goals-title"><h3 id="macro-goals-title">Macro Goals</h3>
      <div className="quick-add-form form-grid">
        {goalNames.map((name) => <div key={name}>
          <label><input type="checkbox" checked={enabled[name]} onChange={(event) => setEnabled((current) => ({ ...current, [name]: event.target.checked }))} /> <span>{labels[name]}</span></label>
          <label><span>Goal value</span><input type="number" min="0.01" step="any" disabled={!enabled[name]} value={values[name]} onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))} /></label>
        </div>)}
      </div>
      <button className="primary-action" type="button" onClick={save}>Save Macro Goals</button>
      {message && <p role="status">{message}</p>}
    </section>
    <section className="about-card"><h3>Account</h3><p>Accounts, login, and cloud sync are not available yet.</p></section>
    <section className="about-card"><h3>Data</h3><p>Export, import, backup, and restore controls are coming later.</p></section>
  </ScreenContainer>
}
export default SettingsScreen
