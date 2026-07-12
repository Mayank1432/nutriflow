import PlaceholderCard from '../components/PlaceholderCard'
import ScreenContainer from '../components/ScreenContainer'
import PrototypeNotice from '../components/PrototypeNotice'
import SummaryCard from '../components/SummaryCard'
import StatusBadge from '../components/StatusBadge'
import IngredientLibrary from '../components/IngredientLibrary'
import { DailyStaplesManager } from '../components/DailyStaples'

const tools = [
  { label: 'Analytics', description: 'Trends and charts will live here.', tone: 'green' as const },
  { label: 'Export / Import', description: 'Backup compatibility comes in a later port.', tone: 'blue' as const },
]

type MoreScreenProps = {
  onOpenSettings: () => void
  focusSection: 'ingredient-library' | 'daily-staples' | null
  intent?: { type: 'ingredient-library' | 'daily-staples' | 'custom-ingredient'; token: number } | null
  onIntentConsumed?: (token: number) => void
}

function MoreScreen({ onOpenSettings, focusSection, intent, onIntentConsumed }: MoreScreenProps) {
  const focusClass = (section: typeof focusSection) => focusSection === section ? ' drawer-focus-section' : ''
  const ingredientLibraryRef = useRef<HTMLDivElement>(null)
  const dailyStaplesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!intent) return
    if (intent.type === 'custom-ingredient') return
    const target = intent.type === 'daily-staples'
      ? dailyStaplesRef.current
      : ingredientLibraryRef.current
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    target.focus({ preventScroll: true })
    onIntentConsumed?.(intent.token)
  }, [focusSection, intent, onIntentConsumed])
  return (
    <ScreenContainer title="More" subtitle="Prototype tools, placeholders, and app information.">
      <PrototypeNotice>Ingredient Library definitions are stored locally in the React app.</PrototypeNotice>
      <SummaryCard>
        <div className="summary-heading">
          <div>
            <p className="eyebrow">Prototype status</p>
            <h3>React data stays safely isolated</h3>
          </div>
          <StatusBadge variant="info">Prototype</StatusBadge>
        </div>
        <p>Today, Weekly, and History use React storage persistence. The React app remains isolated from the production vanilla app.</p>
      </SummaryCard>
      <div ref={ingredientLibraryRef} tabIndex={-1} id="ingredient-library" className={focusClass('ingredient-library')}>
        <IngredientLibrary
          createIntentToken={intent?.type === 'custom-ingredient' ? intent.token : undefined}
          onCreateIntentConsumed={onIntentConsumed}
        />
      </div>
      <div ref={dailyStaplesRef} tabIndex={-1} id="daily-staples" className={focusClass('daily-staples')}><DailyStaplesManager /></div>
      <button className="secondary-action" type="button" onClick={onOpenSettings}>
        Open Settings
      </button>
      <div className="tool-grid">
        {tools.map((tool) => (
          <PlaceholderCard key={tool.label} {...tool} />
        ))}
      </div>
      <article className="about-card">
        <p className="eyebrow">About prototype</p>
        <h3>NutriFlow React preview</h3>
        <p>A design and interaction preview running separately from the production vanilla app.</p>
      </article>
    </ScreenContainer>
  )
}

export default MoreScreen
import { useEffect, useRef } from 'react'
