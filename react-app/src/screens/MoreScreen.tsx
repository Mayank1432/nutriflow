import PlaceholderCard from '../components/PlaceholderCard'
import ScreenContainer from '../components/ScreenContainer'
import PrototypeNotice from '../components/PrototypeNotice'
import SummaryCard from '../components/SummaryCard'
import StatusBadge from '../components/StatusBadge'
import IngredientLibrary from '../components/IngredientLibrary'

const tools = [
  { label: 'Analytics', description: 'Trends and charts will live here.', tone: 'green' as const },
  { label: 'Export / Import', description: 'Backup compatibility comes in a later port.', tone: 'blue' as const },
  { label: 'Settings', description: 'Goals, preferences, and themes are planned.', tone: 'coral' as const },
]

function MoreScreen() {
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
      <IngredientLibrary />
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
