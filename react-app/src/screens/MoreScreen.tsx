import PlaceholderCard from '../components/PlaceholderCard'
import ScreenContainer from '../components/ScreenContainer'
import PrototypeNotice from '../components/PrototypeNotice'
import SummaryCard from '../components/SummaryCard'
import StatusBadge from '../components/StatusBadge'

const tools = [
  { label: 'Analytics', description: 'Trends and charts will live here.', tone: 'green' as const },
  { label: 'All Ingredients', description: 'A future home for ingredient management.', tone: 'yellow' as const },
  { label: 'Export / Import', description: 'Backup compatibility comes in a later port.', tone: 'blue' as const },
  { label: 'Settings', description: 'Goals, preferences, and themes are planned.', tone: 'coral' as const },
]

function MoreScreen() {
  return (
    <ScreenContainer title="More" subtitle="Prototype tools, placeholders, and app information.">
      <PrototypeNotice>Prototype only — these options are placeholders.</PrototypeNotice>
      <SummaryCard>
        <div className="summary-heading">
          <div>
            <p className="eyebrow">Prototype status</p>
            <h3>Mock-only and safely isolated</h3>
          </div>
          <StatusBadge variant="info">Prototype</StatusBadge>
        </div>
        <p>Today, Weekly, and History use in-memory mock data. Nothing here connects to production storage.</p>
      </SummaryCard>
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
