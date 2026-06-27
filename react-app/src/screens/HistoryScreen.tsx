import EmptyStateCard from '../components/EmptyStateCard'
import ScreenContainer from '../components/ScreenContainer'

function HistoryScreen() {
  return (
    <ScreenContainer title="History" subtitle="Your saved days, gathered in one place.">
      <EmptyStateCard
        title="Saved days"
        text="No saved days yet. Your completed daily logs will appear here."
      />
    </ScreenContainer>
  )
}

export default HistoryScreen
