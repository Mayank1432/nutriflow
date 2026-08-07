import { useEffect, useRef, useState } from 'react'
import ScreenContainer from '../components/ScreenContainer'
import type { MacroGoals, ReactSettingsStore } from '../storage'

type SettingsScreenProps = {
  onBack: () => void
  settings: ReactSettingsStore
  onToggleTheme: () => void
  onSaveMacroGoals: (goals: MacroGoals) => boolean
  focusSection?: { type: 'macro-goals' | 'theme'; token: number } | null
  onFocusConsumed?: (token: number) => void
}

const goalNames = ['protein', 'calories', 'carbs', 'fat', 'fibre', 'cost'] as const
type GoalName = typeof goalNames[number]
const labels: Record<GoalName, string> = { protein: 'Protein', calories: 'Calories', carbs: 'Carbs', fat: 'Fat', fibre: 'Fibre', cost: 'Cost' }
const units: Record<GoalName, string> = { protein: 'g', calories: 'kcal', carbs: 'g', fat: 'g', fibre: 'g', cost: '₹' }
type Feedback = { type: 'success' | 'error'; text: string } | null

function SettingsScreen({ onBack, settings, onToggleTheme, onSaveMacroGoals, focusSection, onFocusConsumed }: SettingsScreenProps) {
  const [enabled, setEnabled] = useState(() => Object.fromEntries(goalNames.map((name) => [name, settings.macroGoals[name].enabled])) as Record<GoalName, boolean>)
  const [values, setValues] = useState(() => Object.fromEntries(goalNames.map((name) => [name, settings.macroGoals[name].value === null ? '' : String(settings.macroGoals[name].value)])) as Record<GoalName, string>)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const themeRef = useRef<HTMLElement>(null)
  const macroGoalsRef = useRef<HTMLElement>(null)
  const goalInputRefs = useRef<Partial<Record<GoalName, HTMLInputElement | null>>>({})

  useEffect(() => {
    if (!focusSection) return
    const target = focusSection.type === 'theme' ? themeRef.current : macroGoalsRef.current
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
    target?.focus({ preventScroll: true })
    onFocusConsumed?.(focusSection.token)
  }, [focusSection, onFocusConsumed])

  const requestTheme = (mode: 'light' | 'dark') => {
    if (mode !== settings.theme.mode) onToggleTheme()
  }

  const save = () => {
    const goals = {} as MacroGoals
    for (const name of goalNames) {
      if (!enabled[name]) {
        goals[name] = { enabled: false, value: null }
        continue
      }
      const value = Number(values[name])
      if (values[name].trim() === '' || !Number.isFinite(value) || value <= 0) {
        setFeedback({ type: 'error', text: `${labels[name]} requires a positive number.` })
        window.requestAnimationFrame(() => goalInputRefs.current[name]?.focus())
        return
      }
      goals[name] = { enabled: true, value }
    }
    setFeedback(onSaveMacroGoals(goals)
      ? { type: 'success', text: 'Macro Goals saved.' }
      : { type: 'error', text: 'Macro Goals could not be saved. Try again.' })
  }

  return <div className="settings-screen">
    <ScreenContainer title="Settings" subtitle="Personalise NutriFlow and manage your local preferences.">
      <button className="secondary-action settings-back-action" type="button" onClick={onBack}>← Back to More</button>

      <section className="settings-section" aria-labelledby="personalisation-title">
        <h2 id="personalisation-title" className="settings-section-label">Personalisation</h2>
        <section ref={themeRef} tabIndex={-1} className="settings-card" aria-labelledby="theme-title">
          <div className="settings-card-header"><div><h3 id="theme-title">Theme</h3><p>Choose how NutriFlow looks on this device.</p></div></div>
          <fieldset className="settings-theme-fieldset">
            <legend>Colour theme</legend>
            <div className="settings-theme-options">
              {(['light', 'dark'] as const).map((mode) => <label key={mode} className="settings-theme-option">
                <input type="radio" name="theme-mode" value={mode} checked={settings.theme.mode === mode} onChange={() => requestTheme(mode)} />
                <span>{mode === 'light' ? 'Light' : 'Dark'}</span>
                <span className="settings-theme-check" aria-hidden="true">{settings.theme.mode === mode ? '✓' : ''}</span>
              </label>)}
            </div>
          </fieldset>
        </section>
      </section>

      <section className="settings-section" aria-labelledby="nutrition-title">
        <h2 id="nutrition-title" className="settings-section-label">Nutrition</h2>
        <section ref={macroGoalsRef} tabIndex={-1} className="settings-card" aria-labelledby="macro-goals-title">
          <div className="settings-card-header"><div><h3 id="macro-goals-title">Macro Goals</h3><p>Enable the goals you want to track each day.</p></div></div>
          <div className="macro-goal-list">
            {goalNames.map((name) => <div className={`macro-goal-row${enabled[name] ? ' enabled' : ''}`} key={name}>
              <label className="macro-goal-toggle"><input type="checkbox" checked={enabled[name]} onChange={(event) => setEnabled((current) => ({ ...current, [name]: event.target.checked }))} /><span>{labels[name]}</span></label>
              <div className="macro-goal-value">
                <label className="sr-only" htmlFor={`${name}-goal`}>{labels[name]} goal</label>
                <span className="macro-goal-input-wrap"><input ref={(node) => { goalInputRefs.current[name] = node }} id={`${name}-goal`} type="number" min="0.01" step="any" disabled={!enabled[name]} value={values[name]} onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))} /><span>{units[name]}</span></span>
              </div>
            </div>)}
          </div>
          <button className="primary-action settings-save-action" type="button" onClick={save}>Save Macro Goals</button>
          {feedback && <p className={`settings-feedback ${feedback.type}`} role={feedback.type === 'success' ? 'status' : 'alert'} aria-live={feedback.type === 'success' ? 'polite' : undefined}>{feedback.text}</p>}
        </section>
      </section>

      <section className="settings-section" aria-labelledby="account-title">
        <h2 id="account-title" className="settings-section-label">Account</h2>
        <section className="settings-card settings-placeholder-card" aria-labelledby="account-placeholder-title"><div className="settings-card-header"><div><h3 id="account-placeholder-title">Account</h3><p>Account features are not available in this prototype.</p></div><span className="settings-placeholder-status">Not available</span></div></section>
      </section>

      <section className="settings-section" aria-labelledby="data-title">
        <h2 id="data-title" className="settings-section-label">Data</h2>
        <section className="settings-card settings-placeholder-card" aria-labelledby="backup-title"><div className="settings-card-header"><div><p className="settings-placeholder-detail">Your NutriFlow data is stored locally on this device.</p><h3 id="backup-title">Backup &amp; Restore</h3><p>Backup and restore are not available in this prototype.</p></div><span className="settings-placeholder-status">Coming later</span></div></section>
      </section>
    </ScreenContainer>
  </div>
}

export default SettingsScreen
