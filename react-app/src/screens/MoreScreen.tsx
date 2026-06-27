import PlaceholderCard from '../components/PlaceholderCard'
import ScreenContainer from '../components/ScreenContainer'

const tools = [
  { label: 'Analytics', description: 'Trends and charts will live here.', tone: 'green' as const },
  { label: 'All Ingredients', description: 'A future home for ingredient management.', tone: 'yellow' as const },
  { label: 'Export / Import', description: 'Backup compatibility comes in a later port.', tone: 'blue' as const },
  { label: 'Settings', description: 'Goals, preferences, and themes are planned.', tone: 'coral' as const },
]

function MoreScreen() {
  return (
    <ScreenContainer title="More" subtitle="Tools and preferences, neatly tucked away.">
      <div className="tool-grid">
        {tools.map((tool) => (
          <PlaceholderCard key={tool.label} {...tool} />
        ))}
      </div>
    </ScreenContainer>
  )
}

export default MoreScreen
